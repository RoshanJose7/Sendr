import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
  });
}

function dataURLtoFile(dataurl: string, filename: string) {
  let arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)![1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

function chunkString(str: string, size: number): string[] {
  return str.match(new RegExp(`.{1,${size}}`, "g")) as string[];
}

const socket = io("http://localhost:8000/", { transports: ["websocket"] });

function App() {
  let dataURL = "",
    globalFile: File | null = null;
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  function handleFileChange(e: any) {
    const file: File = e.target.files[0];
    globalFile = file;
  }

  async function handleSendFile() {
    if (!globalFile) return;
    setSending(true);

    const dataURL = await fileToDataURL(globalFile);
    const fileDataURLArray = chunkString(dataURL, 209715);

    socket.emit("fileTransfer", {
      fileName: globalFile.name,
      size: globalFile.size,
    });

    console.log("file created");

    let i = 0;
    while (i < fileDataURLArray.length) {
      const progressPercentage = Math.round(
        (i / fileDataURLArray.length) * 100
      );
      console.log(progressPercentage);
      console.log(
        "Progress: " +
          Math.round((i / fileDataURLArray.length) * 100) +
          "% sent"
      );
      socket.emit("filePart", {
        dataURL: fileDataURLArray[i],
        progressPercentage,
      });
      i++;
    }

    console.log("Progress: 100% sent");
    socket.emit("fileRecieved", {
      fileName: globalFile.name,
      status: "success",
    });
    setSending(false);
  }

  if (!sending) {
    // clear the dataURL variable and expect a new file to arrive
    socket.on("fileTransfer", (data) => {
      // fileName -> full name of the file
      // size -> total file size
      dataURL = "";
      console.log(data);
    });

    // contact the incoming file dataURL parts to the global dataURL parts of the original file
    socket.on("filePart", (data) => {
      // dataURL -> dataURL of a small part of the file ~= 1MB
      // progress -> progress percentage of transfer
      console.log(`Progress: ${data.progressPercentage} recieved`);
      dataURL += data.dataURL;
    });

    // retrieve the status of the transfer with the complete file name
    socket.on("fileRecieved", (data) => {
      // fileName -> complete file name with extension
      // status -> success | failed
      const resultFile = dataURLtoFile(dataURL, data.fileName);
      console.log(data.progressPercentage);
      console.log("Progress: 100% recieved");
      globalFile = null;
      dataURL = "";
    });
  }

  return (
    <main>
      <h1>Sendr</h1>
      <h3>User: {socket.id}</h3>
      <h4>Wanna send a file?</h4>
      <input
        onChange={handleFileChange}
        ref={fileRef}
        type="file"
        name="File"
      />

      <button onClick={handleSendFile} ref={btnRef}>
        Send
      </button>
    </main>
  );
}

export default App;
