// @ts-ignore
const {Mime} = await import("mime");
const mimeTypes = [await import("mime/types/standard.js").then((m) => m.default), await import("mime/types/other.js").then((m) => m.default)];
const mime = new Mime(...mimeTypes);

export default mime;
