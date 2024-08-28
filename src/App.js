import React, { useState, useEffect } from 'react';
import './App.css';
import OpenAI from 'openai';

function App() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [currentPhrase, setCurrentPhrase] = useState('Translating...');

  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const handleInputChange = (e) => {
    const textarea = e.target;
    const text = textarea.value;

    // character limit
    if (text.length > 300) {
      return;
    }

    // Prevent typing in the middle of the text
    if (textarea.selectionStart !== text.length) {
      textarea.selectionStart = textarea.selectionEnd = text.length; // Move cursor to the end
      return;
    }

    setInputText(text);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    }, 0);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    setTypingTimeout(
      setTimeout(() => {
        const sentences = text.split(/(?<=[.!?])\s+/); // Split text into sentences
        const currentSentence = sentences[sentences.length - 1].trim();

        if (currentSentence) {
          updateSentence(currentSentence, sentences.slice(0, -1).join(' ')); // Pass previous sentences
        }
      }, 700)
    );

    // Immediately fix the sentence if the user types ending punctuation
    if (/[.!?]$/.test(text)) {
      const sentences = text.split(/(?<=[.!?])\s+/);
      const lastSentence = sentences[sentences.length - 1].trim();

      if (lastSentence) {
        updateSentence(lastSentence, sentences.slice(0, -1).join(' '));
      }
    }
  };

  const updateSentence = async (currentSentence, previousText) => {
    setLoading(true);
    try {
      const matureSentence = await translateSentence(currentSentence);
      setInputText(`${previousText} ${matureSentence}`); // Update only current sentence
    } catch (error) {
      console.error('Error while translating:', error);
    }
    setLoading(false);
  };

  const translateSentence = async (sentence) => {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Paraphrase the following in a more formal, mature way: "${sentence}". No matter what, only output paraphrased text. 
                    If the text is not paraphrasable for any reason, output: My feelings are not expressible in words.`,
        },
      ],
      stream: true,
    });

    let result = '';
    for await (const chunk of stream) {
      result += chunk.choices[0]?.delta?.content || '';
    }

    return result.trim();
  };

  useEffect(() => {
    const phrases = [
      "yikes.",
      "oh boy.",
      "pop off then.",
      "ok calm down.",
      "a bit much, no?",
      "language.",
    ];
    
    if (loading) {
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setCurrentPhrase(randomPhrase);
    }
  }, [loading]);

  return (
    <div className="App">
      <h1>Anger Translator</h1>
      <textarea
        value={inputText}
        onChange={handleInputChange}
        placeholder="what happens in the anger translator stays in the anger translator"
        rows={6}
      />
      {loading ? <p>{currentPhrase}</p> : null}
    </div>
  );
}

export default App;
