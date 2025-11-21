import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    onUpload?: (file: File) => Promise<string>;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
    value,
    onChange,
    label = 'Image',
    onUpload
}) => {
    const [urlInput, setUrlInput] = useState(value);
    const [uploading, setUploading] = useState(false);
    const [mode, setMode] = useState<'url' | 'upload'>('url');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0 && onUpload) {
            setUploading(true);
            try {
                const url = await onUpload(acceptedFiles[0]);
                onChange(url);
                setUrlInput(url);
            } catch (error) {
                console.error('Upload failed:', error);
                alert('Failed to upload image. Please try again.');
            } finally {
                setUploading(false);
            }
        }
    }, [onUpload, onChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
        },
        maxFiles: 1,
        disabled: !onUpload
    });

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setUrlInput(url);
        onChange(url);
    };

    const handleClear = () => {
        onChange('');
        setUrlInput('');
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">{label}</label>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-3">
                <button
                    type="button"
                    onClick={() => setMode('url')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${mode === 'url'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    URL
                </button>
                {onUpload && (
                    <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${mode === 'upload'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Upload
                    </button>
                )}
            </div>

            {mode === 'url' ? (
                <div className="relative">
                    <input
                        type="url"
                        value={urlInput}
                        onChange={handleUrlChange}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    />
                    {urlInput && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    {uploading ? (
                        <p className="text-slate-600">Uploading...</p>
                    ) : isDragActive ? (
                        <p className="text-blue-600 font-medium">Drop the image here</p>
                    ) : (
                        <>
                            <p className="text-slate-600 font-medium mb-1">
                                Drag & drop an image here, or click to select
                            </p>
                            <p className="text-sm text-slate-500">
                                PNG, JPG, GIF up to 10MB
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Preview */}
            {value && (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                        src={value}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                        }}
                    />
                    <div className="absolute top-2 right-2">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 shadow-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
