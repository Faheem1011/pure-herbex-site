"use client";

import { forwardRef, memo, useImperativeHandle, useRef, useEffect } from "react";

export type ChatTextInputHandle = {
  getValue: () => string;
  setValue: (text: string) => void;
  append: (text: string) => void;
  clear: () => void;
  focus: () => void;
};

type Props = {
  chatKey: string;
  placeholder?: string;
  className?: string;
};

const ChatTextInput = forwardRef<ChatTextInputHandle, Props>(function ChatTextInput(
  { chatKey, placeholder = "Type a message...", className },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.value = "";
  }, [chatKey]);

  useImperativeHandle(ref, () => ({
    getValue: () => inputRef.current?.value ?? "",
    setValue: (text: string) => {
      if (inputRef.current) inputRef.current.value = text;
    },
    append: (text: string) => {
      if (inputRef.current) {
        inputRef.current.value += text;
        inputRef.current.focus();
      }
    },
    clear: () => {
      if (inputRef.current) inputRef.current.value = "";
    },
    focus: () => inputRef.current?.focus(),
  }));

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue=""
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      className={className}
    />
  );
});

export default memo(ChatTextInput);
