"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface UploadZoneProps {
  value: string;
  onChange: (text: string) => void;
  inputType: "transcript" | "blog" | "notes";
}

const PLACEHOLDERS: Record<string, string> = {
  transcript:
    "Paste your video transcript here, or drop a .txt / .md / .pdf file…\n\nExample: 'Hey everyone, today we're talking about the three biggest mistakes founders make when building their first product…'",
  blog: "Paste your blog post content here, or drop a file…",
  notes: "Paste your raw notes, bullet points, or ideas here…",
};

async function extractPdfText(file: File): Promise<string> {
  // Dynamically import pdfjs only when needed (keeps initial bundle small)
  const pdfjsLib = await import("pdfjs-dist");

  // Point worker at the bundled worker file
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n").replace(/\s{3,}/g, " ").trim();
}

export default function UploadZone({ value, onChange, inputType }: UploadZoneProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      setFileName(file.name);

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setExtracting(true);
        try {
          const text = await extractPdfText(file);
          if (!text || text.length < 20) {
            toast.error("Could not extract text from this PDF. Try copy-pasting instead.");
            setFileName(null);
            return;
          }
          onChange(text);
          toast.success(`Extracted ${text.split(/\s+/).length.toLocaleString()} words from PDF`);
        } catch (e) {
          toast.error("PDF extraction failed. Try copy-pasting the text.");
          setFileName(null);
        } finally {
          setExtracting(false);
        }
      } else {
        const text = await file.text();
        onChange(text);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "text/plain": [".txt"], "text/markdown": [".md"], "application/pdf": [".pdf"] },
    maxFiles: 1,
    noClick: true,
  });

  const hasContent = value.trim().length > 0;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div
      {...getRootProps()}
      className={`relative rounded-2xl border-2 transition-all duration-200 ${
        isDragActive
          ? "border-primary bg-primary/5 scale-[1.01]"
          : hasContent
          ? "border-border bg-surface-2"
          : "border-dashed border-border bg-surface-2 hover:border-primary/50"
      }`}
    >
      <input {...getInputProps()} />

      {/* Extracting PDF overlay */}
      <AnimatePresence>
        {extracting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-2xl z-30"
          >
            <Loader2 size={24} className="text-primary animate-spin mb-2" />
            <p className="text-sm text-warm/70">Extracting text from PDF…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state overlay */}
      <AnimatePresence>
        {!hasContent && !isDragActive && !extracting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
          >
            <div className="p-3 rounded-full bg-primary/10 mb-3">
              <Upload size={24} className="text-primary" />
            </div>
            <p className="text-warm/50 text-sm">Drop a file or</p>
            <button
              onClick={open}
              className="pointer-events-auto text-primary hover:text-primary-hover text-sm underline underline-offset-2 mt-0.5"
            >
              browse to upload
            </button>
            <p className="text-muted text-xs mt-1">.txt · .md · .pdf</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag active overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-2xl z-20 pointer-events-none"
          >
            <div className="text-center">
              <Upload size={32} className="text-primary mx-auto mb-2" />
              <p className="text-primary font-heading font-semibold">Drop to load</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (fileName && e.target.value !== value) setFileName(null);
        }}
        placeholder={PLACEHOLDERS[inputType]}
        className={`w-full min-h-[280px] p-5 bg-transparent text-warm/90 text-sm leading-relaxed resize-none outline-none placeholder:text-muted/40 font-body transition-opacity ${
          !hasContent ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Bottom bar */}
      {hasContent && (
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/50">
          <div className="flex items-center gap-2">
            {fileName ? (
              <>
                <FileText size={12} className="text-primary" />
                <span className="text-xs text-muted">{fileName}</span>
              </>
            ) : (
              <span className="text-xs text-muted">{wordCount.toLocaleString()} words</span>
            )}
            {wordCount >= 50 && <CheckCircle size={12} className="text-green-400" />}
          </div>
          <button
            onClick={() => { onChange(""); setFileName(null); }}
            className="text-muted hover:text-warm transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
