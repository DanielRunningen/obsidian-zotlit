import "./main.less";

import { Notice, Plugin, TFolder } from "obsidian";

import ZoteroItems from "./item-index";
import getZoteroLinkHandlers from "./link-handler";
import { ZoteroSettingTab } from "./setting-tab";
import {
  getDefaultSettings,
  loadSettings,
  saveSettings,
  ZoteroSettings,
} from "./settings";
import { CitationSuggesterModal } from "./suggests";
import log from "./utils/logger";
import ZoteroDb from "./zotero-db";

export default class ZoteroPlugin extends Plugin {
  settings: ZoteroSettings = getDefaultSettings();
  loadSettings = loadSettings.bind(this);
  saveSettings = saveSettings.bind(this);

  db = new ZoteroDb(this);
  zoteroItems: ZoteroItems = new ZoteroItems(this);

  async onload() {
    log.info("loading Obsidian Zotero Plugin");

    this.addCommand({
      id: "zotero-search",
      name: "Search Zotero",
      callback: () => new CitationSuggesterModal(this).open(),
    });

    await this.loadSettings();

    getZoteroLinkHandlers(this).forEach((args) =>
      this.registerObsidianProtocolHandler(...args),
    );

    this.db.init();

    this.addSettingTab(new ZoteroSettingTab(this));
  }

  onunload() {
    log.info("unloading Obsidian Zotero Plugin");
  }

  async getLiteratureNoteFolder(): Promise<TFolder> {
    const { literatureNoteFolder: folder } = this.settings;
    let af = folder.getFile(this.app.vault),
      noteFolder: TFolder;
    if (af instanceof TFolder) {
      noteFolder = af;
    } else if (!af) {
      await this.app.vault.createFolder(folder.path);
      af = folder.getFile(this.app.vault);
      if (!(af instanceof TFolder)) {
        throw new Error("Failed to create note folder: " + folder.path);
      }
      noteFolder = af;
    } else {
      new Notice(
        `Invalid note folder: ${folder.path}, revert to default folder`,
      );
      folder.path = "";
      af = folder.getFile(this.app.vault);
      if (!(af instanceof TFolder)) {
        throw new Error("Failed to get default note folder: " + folder.path);
      }
      noteFolder = af;
    }
    return noteFolder;
  }
}
