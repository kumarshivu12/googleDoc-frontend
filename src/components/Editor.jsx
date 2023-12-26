import { useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { Box } from "@mui/material";
import styled from "@emotion/styled";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const Component = styled.div`
  background: #f5f5f5;
`;

const toolbarOptions = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block"],

  [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }], // superscript/subscript
  [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
  [{ direction: "rtl" }], // text direction

  [{ size: ["small", false, "large", "huge"] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],

  ["clean"], // remove formatting button
];

const Editor = () => {
  const [quill, setQuill] = useState();
  const [socket, setSocket] = useState();
  const { id } = useParams();

  //setting up qill server
  useEffect(() => {
    const quillServer = new Quill("#container", {
      theme: "snow",
      modules: { toolbar: toolbarOptions },
    });

    quillServer.disable();
    quillServer.setText("Please wait...");
    setQuill(quillServer);
  }, []);

  //setting up socket.io-client
  useEffect(() => {
    const socket = io("http://localhost:9000");
    setSocket(socket);
    //disconneting socket on leaving site
    return () => {
      socket.disconnect();
    };
  }, []);

  //detect changes in editor
  useEffect(() => {
    //handle editor changes
    const handleChange = (delta, oldDelta, source) => {
      if (!quill || !socket) return;

      if (source !== "user") return;

      //sending chnages to backend
      socket && socket.emit("send-changes", delta);
    };

    quill && quill.on("text-change", handleChange);

    return () => {
      quill && quill.off("text-change", handleChange);
    };
  }, [quill, socket]);

  //receiving changes from server
  useEffect(() => {
    if (!quill || !socket) return;

    const handleChange = (delta) => {
      quill && quill.updateContents(delta);
    };

    socket && socket.on("recieve-changes", handleChange);

    return () => {
      socket && socket.off("receive-changes", handleChange);
    };
  }, [quill, socket]);

  useEffect(() => {
    if (!quill || !socket) return;

    socket &&
      socket.once("load-document", (document) => {
        quill && quill.setContents(document);
        quill && quill.enable();
      });

    //sending id to server to make changes on this document only
    socket && socket.emit("get-document", id);
  }, [quill, socket, id]);

  useEffect(() => {
    if (socket === null || quill === null) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  return (
    <Component>
      <Box className="container" id="container"></Box>
    </Component>
  );
};

export default Editor;
