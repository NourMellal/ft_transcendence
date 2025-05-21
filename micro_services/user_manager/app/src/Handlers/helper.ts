import fs from "fs";
import Stream from "stream";

export async function DownloadGoogleImage(picture_url: string, UID: string): Promise<string> {
    try {
      // spliting google photo url by = and adding =s500 to get 500x500 image
      const picture_route = `/static/profile/${UID}.jpg`;
      const uri = picture_url.split("=");
      const res = await fetch(uri[0] + "=s500");
      if (!res.ok)
        throw 'result not ok'
      if (!res.body)
        throw 'body not ok'
      const file_stream = fs.createWriteStream(picture_route);
      Stream.promises.finished(Stream.Readable.fromWeb(res.body as any).pipe(file_stream));
      return picture_route;
    } catch (error) {
      console.log(`[ERROR] DownloadGoogleImage(): ${error}`);
      return process.env.DEFAULT_PROFILE_PATH as string;
    }
  }