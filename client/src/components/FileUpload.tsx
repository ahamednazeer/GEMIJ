import React, { useState, useRef } from 'react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface FileUploadProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  required?: boolean;
  description?: string;
  onFileSelect: (files: File | File[] | null) => void;
  value?: File | File[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = '.pdf,.doc,.docx',
  multiple = false,
  maxSize = 10,
  required = false,
  description,
  onFileSelect,
  value
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const allowedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return `File type not allowed. Accepted types: ${accept}`;
    }

    return null;
  };

  const handleFiles = (files: FileList) => {
    setError(null);
    const fileArray = Array.from(files);

    // Validate each file
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (multiple) {
      onFileSelect(fileArray);
    } else {
      onFileSelect(fileArray[0] || null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index?: number) => {
    if (multiple && Array.isArray(value) && typeof index === 'number') {
      const newFiles = value.filter((_, i) => i !== index);
      onFileSelect(newFiles.length > 0 ? newFiles : null);
    } else {
      onFileSelect(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'zip':
      case 'rar':
        return '🗜️';
      default:
        return '📎';
    }
  };

  const renderSelectedFiles = () => {
    if (!value) return null;

    const files = Array.isArray(value) ? value : [value];

    return (
      <div className="mt-3 space-y-2">
        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getFileIcon(file.name)}</span>
              <div>
                <p className="text-sm font-medium text-green-900">{file.name}</p>
                <p className="text-xs text-green-700">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeFile(multiple ? index : undefined)}
              className="text-green-700 hover:text-green-900 hover:bg-green-100"
            >
              ✕
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <label className="form-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-primary-400 bg-primary-50'
            : 'border-secondary-300 hover:border-secondary-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          required={required}
        />
        
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-secondary-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4">
            <p className="text-sm text-secondary-600">
              <span className="font-medium text-primary-600 hover:text-primary-500 cursor-pointer">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-secondary-500 mt-1">
              {accept} up to {maxSize}MB {multiple && '(multiple files allowed)'}
            </p>
          </div>
        </div>
      </div>

      {description && (
        <p className="text-sm text-secondary-500">{description}</p>
      )}

      {error && (
        <Alert variant="error" className="mt-2">
          {error}
        </Alert>
      )}

      {renderSelectedFiles()}
    </div>
  );
};

export default FileUpload;