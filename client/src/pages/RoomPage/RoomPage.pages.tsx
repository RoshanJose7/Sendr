import { useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { socket } from "../../Socket";
import { chunkString, dataURLtoFile, fileToDataURL } from "../../utils";

import "./RoomPage.styles.scss";

function RoomPage() {
  const { roomName } = useParams();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  let dataURL = "",
    globalFile: File | null = null;
  const fileRef = useRef<HTMLInputElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  function handleFileChange(e: any) {
    const file: File = e.target.files[0];
    globalFile = file;
  }

  async function handleSendFile() {
    if (!globalFile) return;

    const dataURL = await fileToDataURL(globalFile);
    const fileDataURLArray = chunkString(dataURL, 209715);

    socket.emit("fileTransfer", {
      fileName: globalFile.name,
      size: globalFile.size,
    });

    let i = 0;
    while (i < fileDataURLArray.length) {
      const progressPercentage = Math.round(
        (i / fileDataURLArray.length) * 100
      );

      socket.emit("filePart", {
        dataURL: fileDataURLArray[i],
        progressPercentage,
      });
      i++;
    }

    socket.emit("fileSent", {
      fileName: globalFile.name,
      status: "success",
    });
  }

  // clear the dataURL variable and expect a new file to arrive
  socket.on("fileTransfer", () => {
    // fileName -> full name of the file
    // size -> total file size
    dataURL = "";
  });

  // contact the incoming file dataURL parts to the global dataURL parts of the original file
  socket.on("filePart", (data) => {
    // dataURL -> dataURL of a small part of the file ~= 1MB
    // progress -> progress percentage of transfer
    dataURL += data.dataURL;
  });

  // retrieve the status of the transfer with the complete file name
  socket.on("fileRecieved", (data) => {
    // fileName -> complete file name with extension
    // status -> success | failed
    const resultFile = dataURLtoFile(dataURL, data.fileName);
    setUploadedFiles(Array.from(new Set(uploadedFiles).add(resultFile)));
    globalFile = null;
    dataURL = "";
  });

  return (
    <main id="room-page">
      <h1>Sendr</h1>
      <h3>Welcome to Room {roomName}</h3>

      <div id="upload-section">
        <h4>Upload File</h4>
        <input
          onChange={handleFileChange}
          ref={fileRef}
          type="file"
          name="File"
        />

        <button className="btn" onClick={handleSendFile} ref={btnRef}>
          Send
        </button>
      </div>

      <div id="uploads">
        {uploadedFiles.map((uploadedFile) => {
          return (
            <div key={uploadedFile.name}>
              <h5>Name: {uploadedFile.name}</h5>
              <h5>Size: {uploadedFile.size}</h5>
              <h5>Type: {uploadedFile.type}</h5>

              <a
                href={URL.createObjectURL(uploadedFile)}
                download={uploadedFile.name}
              >
                Download
              </a>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default RoomPage;
