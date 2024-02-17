import { useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const App = () => {
  const { interimTranscript, finalTranscript, transcript, resetTranscript } =
    useSpeechRecognition();

  useEffect(() => {
    SpeechRecognition.startListening({ continuous: true, language: "fr-FR" });
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-20">
      <span>
        {finalTranscript ? (
          <span>{finalTranscript}</span>
        ) : (
          <span>
            {interimTranscript}
            <span className="animate-pulse">...</span>
          </span>
        )}
      </span>
      <button onClick={() => resetTranscript()}>reset</button>
    </div>
  );
};

export default App;
