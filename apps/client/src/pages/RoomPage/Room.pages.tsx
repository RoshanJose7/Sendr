import { v4 as uuid } from "uuid";
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ReactComponent as BrowseSVG } from "../../assets/browse.svg";
import { ReactComponent as ExitSVG } from "../../assets/exit.svg";
import { ReactComponent as SendSVG } from "../../assets/send.svg";
import { ReactComponent as SentSVG } from "../../assets/sent.svg";
import { ReactComponent as DownloadSVG } from "../../assets/download.svg";

import { SocketContext } from "../../utils/Socket";
import { FileTransmitType, UploadStatus } from "../../utils/constants";
import {
  chunkString,
  dataURLtoFile,
  fileToDataURL,
  formatBytes,
} from "../../utils/Files";

import "./Room.styles.scss";

function RoomPage() {
  const { roomName, userName } = useParams();
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  let dataURL = "";
  const fileRef = useRef<HTMLInputElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (socket === null) {
      navigate("/");
      return;
    }

    socket.emit("joinRoom", {
      room: roomName,
      name: userName,
    });

    socket.on("recieverFileTransfer", (data) => {
      setProgress(0);

      const newFile: UploadedFile = {
        id: data.id,
        sender: data.sender,
        file: new File([], data.name, {
          type: data.type,
        }),
        size: data.size,
        status: UploadStatus.PENDING,
        type: FileTransmitType.RECEIVED,
      };

      setHistory((prev) => [...prev, newFile]);
      dataURL = "";
    });

    socket.on("recieverFilePart", (data) => {
      setProgress(data.progressPercentage);
      dataURL += data.dataURL;
    });

    socket.on("recieverFileSent", (data) => {
      const resultFile = dataURLtoFile(dataURL, data.fileName);
      setProgress(100);

      setHistory((prev) => {
        const idx = prev.findIndex(
          (f) => typeof f !== "string" && f.id === data.id
        );

        const oldFile = prev[idx];
        prev.splice(idx, 1);
        oldFile.status = UploadStatus.UPLOADED;
        oldFile.file = resultFile;
        prev.push(oldFile);

        return prev;
      });

      dataURL = "";
      setProgress(0);

      socket.emit("fileRecievedAck", {
        id: socket.id,
        name: userName,
        fileName: data.fileName,
        room: roomName,
      });
    });

    socket.on("disconnect", () => {
      socket.removeAllListeners();
      socket.removeAllListeners("disconnect");
    });

    socket.on("fileSentAck", (data) => {
      const notification = `${data.name} recieved ${data.fileName} successfully`;
      setHistory((prevNotifications) => [...prevNotifications, notification]);
    });

    socket.on("user_joined", (name) => {
      const notification = `${name} joined ${roomName}`;
      setHistory((prevNotifications) => [...prevNotifications, notification]);
    });

    socket.on("user_left", (name) => {
      const notification = `${name} left ${roomName}`;
      setHistory((prevNotifications) => [...prevNotifications, notification]);
    });

    return () => {
      socket.emit("leaveRoom", {
        room: roomName,
        name: userName,
      });
    };
  }, []);

  function handleFileChange(e: any) {
    const files: File[] = Array.from(e.target.files);
    if (files.length > 0) setSelectedFiles(files);
  }

  function handleFile(dataURL: string, file: File) {
    console.log(file);
    if (!file) return;

    setProgress(0);
    const fileId = uuid();
    const fileDataURLArray = chunkString(dataURL, 209715);

    const newFile: UploadedFile = {
      id: fileId,
      sender: userName!,
      file: file,
      size: file.size,
      status: UploadStatus.UPLOADING,
      type: FileTransmitType.SENT,
    };

    setHistory((prev) => [...prev, newFile]);

    socket?.emit("senderFileTransfer", {
      id: fileId,
      sender: userName,
      name: file.name,
      size: file.size,
      type: file.type,
      room: roomName,
    });

    let i = 0;
    while (i < fileDataURLArray.length) {
      const progressPercentage = Math.round(
        (i / fileDataURLArray.length) * 100
      );

      setProgress(progressPercentage);

      socket?.emit("senderFilePart", {
        id: fileId,
        sender: userName,
        name: file.name,
        size: file.size,
        type: file.type,
        dataURL: fileDataURLArray[i],
        progressPercentage,
        room: roomName,
      });

      setHistory((prev) => {
        const idx = prev.findIndex(
          (f) => typeof f !== "string" && f.id === fileId
        );

        const oldFile = prev[idx];
        prev.splice(idx, 1);
        oldFile.status = UploadStatus.UPLOADED;
        prev.push(oldFile);

        return prev;
      });

      i++;
    }

    socket?.emit("senderFileSent", {
      id: fileId,
      sender: userName,
      name: file.name,
      size: file.size,
      type: file.type,
      fileName: file.name,
      room: roomName,
    });

    setHistory((prevNotifications) => [
      ...prevNotifications,
      `${file?.name} sent successfully`,
    ]);
    setSelectedFiles([]);
    setProgress(100);
  }

  function handleSendFile() {
    if (selectedFiles.length === 0) return;
    console.log(selectedFiles);

    for (let i = 0; i < selectedFiles.length; i++) {
      fileToDataURL(selectedFiles[i], handleFile);
    }
  }

  return (
    <main id="room-page">
      <div id="room-page-header">
        <h2>Room {roomName}</h2>

        <button className="btn" onClick={() => navigate("/")}>
          <ExitSVG />
        </button>
      </div>

      <div id="room-page-content">
        {history.length !== 0 ? (
          history.map((his, idx) =>
            typeof his === "string" ? (
              <h4 key={idx} className="notification">
                {his}
              </h4>
            ) : his.type === FileTransmitType.SENT ? (
              <div key={idx} className="file right">
                <h4>{his.sender}</h4>

                <div className="file-container">
                  <div
                    className={`fm_file ${
                      "ft_" + his.file.name.split(".").pop()
                    }`}
                  ></div>

                  <div className="file-content">
                    <h5>
                      {his.file.name.split(".")[0].substring(0, 7)}....
                      {his.file.name.split(".")[1]}
                    </h5>
                    <p>{formatBytes(his.size)}</p>
                  </div>

                  {his.status === UploadStatus.UPLOADED ? (
                    <SentSVG />
                  ) : (
                    <h5>{progress}%</h5>
                  )}
                </div>
              </div>
            ) : (
              <div key={idx} className="file left">
                <h4>{his.sender}</h4>

                <div className="file-container">
                  <div
                    className={`fm_file ${
                      "ft_" + his.file.name.split(".").pop()
                    }`}
                  ></div>

                  <div className="file-content">
                    <h5>
                      {his.file.name.split(".")[0].substring(0, 7)}....
                      {his.file.name.split(".")[1]}
                    </h5>
                    <p>{formatBytes(his.size)}</p>
                  </div>

                  {his.status === UploadStatus.UPLOADED ? (
                    <a
                      href={URL.createObjectURL(his.file)}
                      download={his.file.name}
                    >
                      <DownloadSVG />
                    </a>
                  ) : (
                    <h5>{progress}%</h5>
                  )}
                </div>
              </div>
            )
          )
        ) : (
          <div className="center">
            <h5>No Files Yet!</h5>
          </div>
        )}
      </div>

      <div id="room-page-upload-section">
        {selectedFiles.length > 0 ? (
          <div className="selected-files">
            {selectedFiles.map((selectedFile, idx) => (
              <h3 key={idx}>
                {selectedFile.name.length <= 10
                  ? selectedFile.name
                  : selectedFile.name.split(".")[0].substring(0, 10) +
                    "..." +
                    selectedFile.name.split(".")[1]}{" "}
                <span>{formatBytes(selectedFile.size)}</span>
              </h3>
            ))}
          </div>
        ) : (
          <h3>Select Files to send</h3>
        )}

        <input
          onChange={handleFileChange}
          ref={fileRef}
          multiple
          type="file"
          name="File"
        />

        <div id="room-page-upload-section-buttons">
          <button className="btn" onClick={() => fileRef.current!.click()}>
            <BrowseSVG />
          </button>

          <button className="btn" onClick={handleSendFile} ref={btnRef}>
            <SendSVG />
          </button>
        </div>
      </div>
    </main>
  );
}

export default RoomPage;
