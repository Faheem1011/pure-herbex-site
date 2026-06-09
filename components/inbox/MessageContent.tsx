"use client";

import type { Contact, Message } from "@/app/inbox/types";
import CustomAudioPlayer from "./CustomAudioPlayer";
import VoiceAgentNote from "./VoiceAgentNote";

type Props = {
  msg: Message;
  isMe: boolean;
  quoteChat?: Contact | null;
  onUpdateAgentNote?: (messageId: string, note: string) => void;
};

export default function MessageContent({ msg, isMe, quoteChat, onUpdateAgentNote }: Props) {
  if (msg.isDeleted) {
    return (
      <p className="italic text-[#8696a0] text-sm flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        This message was deleted
      </p>
    );
  }

  const type = msg.type || "text";

  const renderQuotedMessage = () => {
    if (!msg.replyTo || !quoteChat) return null;
    const quotedMsg = quoteChat.messages.find((m) => m.id === msg.replyTo);
    if (!quotedMsg) return null;

    return (
      <div
        className={`mb-1.5 pl-2.5 py-1.5 pr-2 rounded-md border-l-[3px] text-xs max-w-full ${
          isMe
            ? "border-[#53bdeb] bg-black/20 text-[#d1f4ff]"
            : "border-[#00a884] bg-black/25 text-[#e9edef]"
        }`}
      >
        <div className="font-semibold text-[11px] mb-0.5 text-[#00a884]">
          {quotedMsg.sender === "me" ? "You" : quoteChat.name}
        </div>
        <div className="truncate opacity-90">
          {quotedMsg.isDeleted
            ? "Deleted message"
            : quotedMsg.type === "image"
              ? "Photo"
              : quotedMsg.type === "sticker"
                ? "Sticker"
                : quotedMsg.type === "audio" || quotedMsg.type === "voice"
                  ? "Voice message"
                  : quotedMsg.text}
        </div>
      </div>
    );
  };

  const deliveryFailed =
    msg.sender === "me" && msg.status === "failed" && msg.deliveryError;

  const failureBanner = deliveryFailed ? (
    <p className="text-[11px] text-rose-300/90 mt-1.5 flex items-start gap-1">
      <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
      </svg>
      {msg.deliveryError}
    </p>
  ) : null;

  if (type === "image") {
    return (
      <div className="space-y-1">
        {renderQuotedMessage()}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/media/?id=${msg.mediaId}`}
          alt="Photo"
          className="max-w-full max-h-72 rounded-md object-contain cursor-pointer"
          onClick={() => window.open(`/api/media/?id=${msg.mediaId}`, "_blank")}
        />
        {msg.text && msg.text !== "📷 Photo" && (
          <p className="whitespace-pre-wrap text-[14.2px] leading-[19px] pt-1">{msg.text}</p>
        )}
        {failureBanner}
      </div>
    );
  }

  if (type === "audio" || type === "voice") {
    return (
      <div>
        {renderQuotedMessage()}
        <VoiceAgentNote
          note={msg.agentNote}
          editable={isMe && !!onUpdateAgentNote}
          onSave={(note) => onUpdateAgentNote?.(msg.id, note)}
        />
        <CustomAudioPlayer src={`/api/media/?id=${msg.mediaId}`} isMe={isMe} />
        {failureBanner}
      </div>
    );
  }

  if (
    type === "video" ||
    (type === "document" && msg.mediaId && /\.(mp4|m4v|mov|3gp|webm)$/i.test(msg.fileName || ""))
  ) {
    return (
      <div className="space-y-1">
        {renderQuotedMessage()}
        <video
          controls
          playsInline
          preload="metadata"
          src={`/api/media/?id=${msg.mediaId}`}
          className="max-w-full max-h-72 rounded-md"
        />
        {msg.text && msg.text !== "🎥 Video" && (
          <p className="whitespace-pre-wrap text-[14.2px] leading-[19px] pt-1">{msg.text}</p>
        )}
        {failureBanner}
      </div>
    );
  }

  if (type === "sticker") {
    return (
      <div>
        {renderQuotedMessage()}
        {msg.mediaId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/?id=${msg.mediaId}`}
            alt="Sticker"
            className="w-32 h-32 object-contain"
          />
        ) : (
          <p className="text-sm">🎭 Sticker</p>
        )}
      </div>
    );
  }

  if (type === "document") {
    return (
      <div className="space-y-1">
        {renderQuotedMessage()}
        <a
          href={`/api/media/?id=${msg.mediaId}`}
          download={msg.fileName || "document"}
          className="flex items-center gap-3 p-2.5 bg-black/20 rounded-lg hover:bg-black/30 transition-colors no-underline text-inherit min-w-[200px]"
        >
          <div className="w-10 h-10 bg-[#00a884]/15 text-[#00a884] rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-medium text-sm block truncate">{msg.fileName || "Document"}</span>
            <span className="text-[11px] text-[#8696a0]">Tap to download</span>
          </div>
        </a>
        {failureBanner}
      </div>
    );
  }

  if (type === "location" && msg.location) {
    return (
      <div className="space-y-1">
        {renderQuotedMessage()}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${msg.location.latitude},${msg.location.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2.5 bg-black/20 rounded-lg hover:bg-black/30 transition-colors no-underline text-inherit min-w-[200px]"
        >
          <div className="w-10 h-10 bg-[#00a884]/15 text-[#00a884] rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-medium text-sm block truncate">
              {msg.location.name || "Location"}
            </span>
            {msg.location.address && (
              <span className="text-[11px] text-[#8696a0] block truncate">{msg.location.address}</span>
            )}
          </div>
        </a>
        {failureBanner}
      </div>
    );
  }

  const legacyUnsupported =
    msg.text === "(unsupported message)" ||
    (msg.type === "unsupported" && !msg.systemKind);

  if (legacyUnsupported) {
    return (
      <div>
        {renderQuotedMessage()}
        <div className="rounded-lg px-3 py-2.5 text-[13px] leading-[18px] bg-[#00a884]/15 border border-[#00a884]/30 text-[#d9fdd3]">
          <p className="whitespace-pre-wrap break-words">
            🔐 WhatsApp / Meta verification or system message{"\n\n"}
            The Business API cannot display this message type. Open the WhatsApp app on your phone,
            find this chat, and read the confirmation code there.
          </p>
        </div>
        {failureBanner}
      </div>
    );
  }

  if (msg.systemKind || msg.type === "system") {
    const isVerification = msg.systemKind === "meta_verification";
    return (
      <div>
        {renderQuotedMessage()}
        <div
          className={`rounded-lg px-3 py-2.5 text-[13px] leading-[18px] ${
            isVerification
              ? "bg-[#00a884]/15 border border-[#00a884]/30 text-[#d9fdd3]"
              : "bg-black/25 border border-[#ffffff14] text-[#e9edef]"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
        </div>
        {failureBanner}
      </div>
    );
  }

  return (
    <div>
      {renderQuotedMessage()}
      <p className="whitespace-pre-wrap text-[14.2px] leading-[19px] break-words">{msg.text}</p>
      {failureBanner}
    </div>
  );
}
