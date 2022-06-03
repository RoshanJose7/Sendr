export function fileToDataURL(
  fileid: string,
  file: File,
  handleFile: { (dataURL: string, file: File, fileid: string): void }
) {
  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = () => handleFile(reader.result as string, file, fileid);
  reader.onerror = (e) => console.error(e);
}

export function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

export function chunkString(str: string, size: number): string[] {
  return str.match(new RegExp(`.{1,${size}}`, "g")) as string[];
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
