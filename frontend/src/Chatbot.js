import React, { useState, useRef, useEffect } from 'react';
import { chatApi } from './api';

export default function Chatbot(){
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const boxRef = useRef();

  useEffect(()=>{
    if(boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages]);

  const send = async ()=>{
    const text = input.trim();
    if(!text) return;
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInput('');
    try{
      const res = await chatApi(text);
      const bot = res.reply || 'No reply from server';
      setMessages(prev => [...prev, { sender: 'bot', text: bot }]);
    }catch(err){
      console.error(err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error contacting server' }]);
    }
  }

  const onKeyDown = (e)=>{ if(e.key === 'Enter') send(); }

  return (
    <div className="chat-container">
      <h4>TringTringGo Chatbot</h4>
      <div className="chat-box" ref={boxRef}>
        {messages.map((m,idx)=>(
          <div key={idx} className={`message ${m.sender}`}>
            <div className="sender">{m.sender}</div>
            <div className="text">{m.text.split('\n').map((line,i)=>(<div key={i}>{line}</div>))}</div>
          </div>
        ))}
      </div>
      <div className="input-row">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKeyDown}
          placeholder="Try: 'top places' or 'hospital near uttara'" />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
