'use client';

import { useState } from 'react';
import { CheckCircle2, FileCode, Sparkles } from 'lucide-react';
import { FileDropzone } from './FileDropzone';
import { ProcessingModeSelector, ProcessingMode } from './ProcessingModeSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type WorkflowStep = 'select-files' | 'choose-mode' | 'uploading' | 'preview-specs' | 'complete';

interface UploadWorkflowProps {
  projectSlug: string;
  onComplete: () => void;
}

interface GeneratedSpec {
  id: string;
  path: string;
  docType: string;
  title: string;
}

interface ProcessResult {
  documentId: string;
  path: string;
  mode: string;
  status: string;
  specsGenerated?: number;
  analysis?: {
    features: number;
    constraints: number;
    decisions: number;
    techStack: any;
  };
  generatedDocuments?: GeneratedSpec[];
}

export function UploadWorkflow({ projectSlug, onComplete }: UploadWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('select-files');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('generate-specs');
  const [processResults, setProcessResults] = useState<ProcessResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<string>('0.00');

  const steps = [
    { id: 'select-files', label: 'Select Files', step: 1 },
    { id: 'choose-mode', label: 'Processing Mode', step: 2 },
    { id: 'uploading', label: 'Upload & Process', step: 3 },
    { id: 'preview-specs', label: 'Review Generated Specs', step: 4 },
    { id: 'complete', label: 'Complete', step: 5 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    if (files.length > 0) {
      setCurrentStep('choose-mode');
    }
  };

  const handleModeSelected = () => {
    setCurrentStep('uploading');
    startUpload();
  };

  const startUpload = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Upload files
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const uploadRes = await fetch(`/api/projects/${projectSlug}/knowledge/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadRes.json();

      // Step 2: Process documents
      const documentIds = uploadData.documents.map((doc: any) => doc.id);

      const processRes = await fetch(`/api/projects/${projectSlug}/knowledge/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds,
          mode: processingMode,
        }),
      });

      if (!processRes.ok) {
        throw new Error('Processing failed');
      }

      const processData = await processRes.json();

      setProcessResults(processData.documents || []);
      setTotalCost(processData.totalCost || '0.00');

      // If generate-specs mode, show preview
      if (processingMode === 'generate-specs') {
        setCurrentStep('preview-specs');
      } else {
        // As-is mode - skip to complete
        setCurrentStep('complete');
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    setCurrentStep('complete');
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  idx <= currentStepIndex
                    ? 'bg-black dark:bg-white border-black dark:border-white'
                    : 'bg-white dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700'
                }`}
              >
                {idx < currentStepIndex ? (
                  <CheckCircle2 className="w-6 h-6 text-white dark:text-black" />
                ) : (
                  <span
                    className={`text-sm font-medium ${
                      idx <= currentStepIndex
                        ? 'text-white dark:text-black'
                        : 'text-neutral-400'
                    }`}
                  >
                    {step.step}
                  </span>
                )}
              </div>

              <span
                className={`text-xs mt-2 text-center ${
                  idx <= currentStepIndex
                    ? 'text-black dark:text-white'
                    : 'text-neutral-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 transition-colors ${
                  idx < currentStepIndex
                    ? 'bg-black dark:bg-white'
                    : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        {currentStep === 'select-files' && (
          <div>
            <h2 className="text-2xl font-light text-black dark:text-white mb-6">
              Select Documents to Upload
            </h2>
            <FileDropzone onFilesSelected={handleFilesSelected} />
          </div>
        )}

        {currentStep === 'choose-mode' && (
          <div>
            <h2 className="text-2xl font-light text-black dark:text-white mb-6">
              Choose Processing Mode
            </h2>

            <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                <strong>{selectedFiles.length}</strong> {selectedFiles.length === 1 ? 'file' : 'files'} selected:
              </p>
              <ul className="mt-2 space-y-1">
                {selectedFiles.slice(0, 5).map((file, idx) => (
                  <li key={idx} className="text-xs text-neutral-500 dark:text-neutral-500">
                    • {file.name}
                  </li>
                ))}
                {selectedFiles.length > 5 && (
                  <li className="text-xs text-neutral-500 dark:text-neutral-500">
                    ... and {selectedFiles.length - 5} more
                  </li>
                )}
              </ul>
            </div>

            <ProcessingModeSelector
              selectedMode={processingMode}
              onModeChange={setProcessingMode}
            />

            <div className="mt-6 flex items-center gap-3">
              <Button variant="ghost" onClick={() => setCurrentStep('select-files')}>
                Back
              </Button>

              <Button onClick={handleModeSelected}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'uploading' && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-900 mb-6">
              <div className="animate-spin w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full" />
            </div>

            <h2 className="text-2xl font-light text-black dark:text-white mb-2">
              {isProcessing ? 'Processing Documents...' : 'Uploading...'}
            </h2>

            <p className="text-neutral-600 dark:text-neutral-400">
              {processingMode === 'generate-specs'
                ? 'AI is analyzing your documents and generating implementation specs...'
                : 'Uploading and indexing your documents...'}
            </p>

            {error && (
              <div className="mt-6 p-4 bg-danger/10 border border-danger/20 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-danger">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep('select-files')}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'preview-specs' && processResults.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-light text-black dark:text-white mb-2">
                Generated Implementation Specs
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                AI generated {processResults.reduce((sum, r) => sum + (r.specsGenerated || 0), 0)} specification documents.
                Review them below or click Finish to complete.
              </p>
            </div>

            {processResults.map((result, idx) => (
              <Card key={idx} className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <Sparkles className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-black dark:text-white mb-1">
                        Source: {result.path}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Generated {result.specsGenerated} specification files
                      </p>
                    </div>
                  </div>

                  {result.analysis && (
                    <div className="mb-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                      <h4 className="text-sm font-medium text-black dark:text-white mb-3">Analysis Results:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-2xl font-light text-black dark:text-white">
                            {result.analysis.features}
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">Features</div>
                        </div>
                        <div>
                          <div className="text-2xl font-light text-black dark:text-white">
                            {result.analysis.constraints}
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">Constraints</div>
                        </div>
                        <div>
                          <div className="text-2xl font-light text-black dark:text-white">
                            {result.analysis.decisions}
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">Decisions</div>
                        </div>
                        <div>
                          <div className="text-sm font-mono text-black dark:text-white">
                            {result.analysis.techStack?.framework || 'N/A'}
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">Tech Stack</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.generatedDocuments && result.generatedDocuments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-black dark:text-white mb-3">Generated Files:</h4>
                      <div className="space-y-2">
                        {result.generatedDocuments.map((doc, docIdx) => (
                          <div
                            key={docIdx}
                            className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg"
                          >
                            <FileCode className="w-4 h-4 text-neutral-400" />
                            <div className="flex-1">
                              <div className="text-sm font-mono text-black dark:text-white">
                                {doc.path}
                              </div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                {doc.docType}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Total AI Cost: <span className="font-mono">${totalCost}</span>
              </div>

              <Button onClick={handleFinish} size="lg">
                Finish & Review Specs
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>

            <h2 className="text-2xl font-light text-black dark:text-white mb-2">
              Upload Complete!
            </h2>

            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {selectedFiles.length} {selectedFiles.length === 1 ? 'document' : 'documents'} processed successfully
            </p>

            {processingMode === 'generate-specs' && (
              <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                ✓ Generated {processResults.reduce((sum, r) => sum + (r.specsGenerated || 0), 0)} implementation specs
              </p>
            )}

            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              Redirecting to library...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
