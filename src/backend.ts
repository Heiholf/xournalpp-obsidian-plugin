import {
	Plugin,
	FileSystemAdapter,
	TAbstractFile,
	TFile,
	Notice,
	Editor,
	loadPdfJs,
} from "obsidian";

import { exec } from "child_process";

import * as path from "path";

import * as gzip from "gzip-js";

import { ReadableStream } from "stream/web";
import { Blob } from "buffer";

export async function compileXoppFile(
	file: TAbstractFile | string,
	plugin: Plugin
) {
	const file_path = file instanceof TAbstractFile ? file.path : file;
	const fs: FileSystemAdapter = plugin.app.vault.adapter as FileSystemAdapter;
	const full_path = fs.getFullPath(file_path).replace(".xopp.pdf", ".xopp");
	var cmd = `${getSystemPrefix()}xournalpp "${full_path}" -p "${full_path}.pdf"`;
	await exec(cmd, (err, stdout, stderr) => {
		console.log(err, stdout, stderr);
	});
	new Notice(`Compiled ${path.basename(full_path)}!`);
}

export async function compileAllXoppFiles(plugin: Plugin) {
	var files: TFile[] = await plugin.app.vault.getFiles();
	await files.map(async (file: TFile) => {
		const file_name = path.basename(file.path);
		if (file_name.endsWith(".xopp")) {
			await compileXoppFile(file, plugin);
		}
	});
	new Notice("Recompiled all!");
}

export async function openXoppFile(
	file: TAbstractFile | string,
	plugin: Plugin
) {
	const file_path = file instanceof TAbstractFile ? file.path : file;
	const fs: FileSystemAdapter = plugin.app.vault.adapter as FileSystemAdapter;
	const full_path = fs.getFullPath(file_path).replace(".xopp.pdf", ".xopp");
	var cmd = `${getSystemPrefix()}xournalpp "${full_path}"`;
	await exec(cmd, (err, stdout, stderr) => {
		console.log(err, stdout, stderr);
	});
}

export function getPluginDir(asset: string, plugin: Plugin) {
	return `${plugin.app.vault.configDir}/plugins/${plugin.manifest.id}/${asset}`;
}

export async function createAndEmbedFile(plugin: Plugin): Promise<void> {
	let file_path: string | null = await createNewFile(plugin);
	if (file_path != null) {
		const editor: Editor | undefined =
			plugin.app.workspace.activeEditor?.editor;
		editor?.replaceRange(
			`![[${file_path.replace("\\", "/")}]]\n![[${file_path.replace(
				"\\",
				"/"
			)}.pdf]]`,
			editor?.getCursor()
		);
	}
}

export async function createNewFile(plugin: Plugin): Promise<string | null> {
	if (!plugin.app.workspace.activeEditor) {
		new Notice("Missing cursor!");
		return null;
	}

	const fs: FileSystemAdapter = plugin.app.vault.adapter as FileSystemAdapter;

	const default_path: string = getPluginDir(`default.xopp`, plugin);
	const local_path: string = path.join(
		plugin.app.workspace.activeEditor?.file?.path! + ".1.xopp"
	);

	try {
		await fs.copy(default_path, local_path);
	} catch {
		new Notice("File already exists");
	}

	compileXoppFile(local_path, plugin);

	return local_path;
}

function getSystemPrefix(): string {
	switch (process.platform) {
		case "win32": {
			return "start ";
			break;
		}
		case "linux": {
			return "";
			break;
		}
		default: {
			return "";
			break;
		}
	}
}

export async function createNewXoppFileFromPdf(
	file: TAbstractFile | string,
	plugin: Plugin
) {
	const original_pdf_path = file instanceof TAbstractFile ? file.path : file;
	const new_xopp_file_path = original_pdf_path + ".xopp";
	const new_bg_pdf_file_path = new_xopp_file_path + ".bg.pdf";
	const fs: FileSystemAdapter = plugin.app.vault.adapter as FileSystemAdapter;

	const binary: ArrayBuffer = await fs.readBinary(original_pdf_path);

	let pdfjs = await loadPdfJs();

	pdfjs.GlobalWorkerOptions.workerSrc = "worker";
	let pdf_loader: any = pdfjs.getDocument(binary);
	let pdf_file: any = await pdf_loader.promise;

	const page_count: number = pdf_file.numPages;

	let viewports: Array<[number, number]> = [];

	for (let i = 0; i < page_count; i++) {
		const page = await pdf_file.getPage(i + 1);
		const viewbox = await page.getViewport().viewBox;
		viewports.push([viewbox[2], viewbox[3]]);
	}

	let xopp_string = writeXoppXaml(viewports);

	let compressed_xopp = compressWithGzip(xopp_string);

	await fs.writeBinary(new_xopp_file_path, compressed_xopp);
	await fs.copy(original_pdf_path, new_bg_pdf_file_path);
}

function writeXoppXaml(page_sizes: Array<[number, number]>): string {
	var doc: XMLDocument = document.implementation.createDocument("", "", null);
	var xournalElement = doc.createElement("xournal");
	xournalElement.setAttribute("creator", "obsidian-xournalpp-plugin");

	let titleElement = doc.createElement("title");
	titleElement.appendText("Titel");
	xournalElement.appendChild(titleElement);

	page_sizes.forEach((value, index) => {
		var pageElement = doc.createElement("page");
		pageElement.setAttribute("width", value[0].toString());
		pageElement.setAttribute("height", value[1].toString());
		var background_element = doc.createElement("background");
		background_element.setAttribute("type", "pdf");
		if (index == 0) {
			background_element.setAttribute("domain", "attach");
			background_element.setAttribute("filename", "bg.pdf");
		}
		background_element.setAttribute("pageno", (index + 1).toString());
		pageElement.appendChild(background_element);
		var layerElement = doc.createElement("layer");
		pageElement.appendChild(layerElement);

		xournalElement.appendChild(pageElement);
	});

	doc.appendChild(xournalElement);

	return new XMLSerializer().serializeToString(doc.documentElement);
}

function compressWithGzip(inputString: string): ArrayBuffer {
	return gzip.zip(inputString);
}
