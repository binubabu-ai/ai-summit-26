'use client';

import { useCallback, useState } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileWithPreview {
  file: File;
  id: string;
  error?: string;
}

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  disabled?: boolean;
}

export function FileDropzone({
  onFilesSelected,
  maxFiles = 50,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['.md', '.txt', '.pdf', '.docx'],
  disabled = false,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File exceeds ${(maxFileSize / 1024 / 1024).toFixed(0)}MB limit`;
    }

    // Check file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.some(type => type === extension)) {
      return `File type ${extension} not supported`;
    }

    return null;
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Check max files limit
    if (selectedFiles.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validatedFiles: FileWithPreview[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);

      validatedFiles.push({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        error: validationError || undefined,
      });
    }

    setSelectedFiles(prev => [...prev, ...validatedFiles]);
    setError(null);
  }, [selectedFiles, maxFiles, maxFileSize, acceptedTypes]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setError(null);
  };

  const handleUpload = () => {
    const validFiles = selectedFiles.filter(f => !f.error);
    if (validFiles.length === 0) {
      setError('No valid files to upload');
      return;
    }

    onFilesSelected(validFiles.map(f => f.file));
  };

  const validFilesCount = selectedFiles.filter(f => !f.error).length;
  const hasErrors = selectedFiles.some(f => f.error);

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card>
        <CardContent className="p-0">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-2 border-dashed rounded-lg p-12 text-center transition-colors
              ${isDragging
                ? 'border-black dark:border-white bg-neutral-50 dark:bg-neutral-900'
                : 'border-neutral-200 dark:border-neutral-800'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700'}
            `}
          >
            <input
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={handleFileInput}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />

            <Upload className="w-12 h-12 mx-auto mb-4 text-neutral-400" />

            <h3 className="text-lg font-normal text-black dark:text-white mb-2">
              Drop files here or click to browse
            </h3>

            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Supports {acceptedTypes.join(', ')} files up to {(maxFileSize / 1024 / 1024).toFixed(0)}MB
            </p>

            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
              Maximum {maxFiles} files
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-danger/10 border border-danger/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-black dark:text-white">
                Selected Files ({validFilesCount} valid)
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={disabled}
              >
                Clear All
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedFiles.map((fileWithPreview) => (
                <div
                  key={fileWithPreview.id}
                  className={`
                    flex items-center justify-between p-3 rounded-md border
                    ${fileWithPreview.error
                      ? 'bg-danger/5 border-danger/20'
                      : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className={`w-5 h-5 flex-shrink-0 ${
                      fileWithPreview.error ? 'text-danger' : 'text-neutral-600 dark:text-neutral-400'
                    }`} />

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${
                        fileWithPreview.error
                          ? 'text-danger'
                          : 'text-black dark:text-white'
                      }`}>
                        {fileWithPreview.file.name}
                      </p>

                      <p className="text-xs text-neutral-500 dark:text-neutral-500">
                        {(fileWithPreview.file.size / 1024).toFixed(2)} KB
                      </p>

                      {fileWithPreview.error && (
                        <p className="text-xs text-danger mt-1">
                          {fileWithPreview.error}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFile(fileWithPreview.id)}
                    disabled={disabled}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  </button>
                </div>
              ))}
            </div>

            {/* Upload Button */}
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                onClick={handleUpload}
                disabled={disabled || validFilesCount === 0}
                className="w-full"
              >
                Upload {validFilesCount} {validFilesCount === 1 ? 'File' : 'Files'}
              </Button>

              {hasErrors && (
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2 text-center">
                  Files with errors will be skipped
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
