import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { File, Send, X, Mic, Square } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = ({ imgs }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const { sendMessage, groupname } = useChatStore();

  // Handle image/video/audio selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (
      !file.type.startsWith("image/") &&
      !file.type.startsWith("video/") &&
      !file.type.startsWith("audio/") &&
      !file.type.startsWith("image/gif") &&
      file.type !== "text/plain"
    ) {
      toast.error("Please select a valid file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBlob(reader.result);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error("Failed to start recording");
      console.error(error);
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Remove preview (image or audio)
  const removeImage = () => {
    setImagePreview(null);
    setAudioBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle sending the message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview || audioBlob,
        groupName: groupname,
        profile: imgs,
      });

      setText("");
      setImagePreview(null);
      setAudioBlob(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {/* Preview Section */}
      {(imagePreview || audioBlob) && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {imagePreview ? (
              imagePreview.startsWith("data:image") ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg border"
                />
              ) : imagePreview.startsWith("data:video") ? (
                <video
                  src={imagePreview}
                  className="w-16 h-16 object-cover rounded-lg border"
                  controls
                />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center bg-base-200 rounded-lg">
                  <File className="w-8 h-8" />
                </div>
              )
            ) : audioBlob && (
              <audio src={audioBlob} controls className="w-48" />
            )}
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              aria-label="Remove preview"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*,video/*,audio/*,text/plain"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          {/* File Button */}
          <button
            type="button"
            className="btn btn-circle btn-sm"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
          >
            <File className="w-4 h-4" />
          </button>

          {/* Record Button */}
          <button
            type="button"
            className={`btn btn-circle btn-sm ${isRecording ? 'btn-error' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <Square className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          className="btn btn-primary btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview && !audioBlob}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
