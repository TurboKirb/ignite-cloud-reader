import { useCallback, useState } from 'react';
import { useLocation } from 'wouter';
import { useReader } from '@/lib/reader-context';
import { BookOpen, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [, setLocation] = useLocation();
  const { setFileBuffer } = useReader();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file || !file.name.endsWith('.epub')) {
      alert('Please upload an EPUB file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (buffer) {
        setFileBuffer(buffer);
        setLocation('/reader');
      }
    };
    reader.readAsArrayBuffer(file);
  }, [setFileBuffer, setLocation]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-serif text-foreground">Welcome to Reader</h1>
          <p className="text-muted-foreground font-sans">
            A calm, focused place for your books. Drop an EPUB file to begin.
          </p>
        </div>

        <Card 
          className={`border-2 border-dashed transition-all duration-200 ${
            isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted hover:border-primary/50'
          }`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          data-testid="dropzone-epub"
        >
          <CardContent className="p-12 text-center flex flex-col items-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">Drop your EPUB here</h3>
              <p className="text-sm text-muted-foreground">or click to select a file</p>
            </div>
            
            <div className="relative">
              <Button variant="secondary" data-testid="button-select-file">
                Select File
              </Button>
              <input
                type="file"
                accept=".epub,application/epub+zip"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={onFileInput}
                data-testid="input-file"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
