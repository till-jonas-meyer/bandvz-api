export function getBandImgFilename(imgUuid: string, imgExt: string | null) {
  let filename = `storage/bandimgs/${imgUuid}`;
  if (imgExt) {
    filename += `.${imgExt}`;
  }
  return filename;
}
