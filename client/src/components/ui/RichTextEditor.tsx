import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = 'Enter text...',
    maxLength
}) => {
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline',
        'list', 'bullet',
        'link'
    ];

    const handleChange = (content: string) => {
        if (maxLength) {
            const plainText = content.replace(/<[^>]*>/g, '');
            if (plainText.length <= maxLength) {
                onChange(content);
            }
        } else {
            onChange(content);
        }
    };

    const getCharCount = () => {
        const plainText = value.replace(/<[^>]*>/g, '');
        return plainText.length;
    };

    return (
        <div className="rich-text-editor">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={handleChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className="bg-white rounded-lg border border-slate-300"
            />
            {maxLength && (
                <div className="text-sm text-slate-500 mt-1 text-right">
                    {getCharCount()} / {maxLength} characters
                </div>
            )}
        </div>
    );
};

export default RichTextEditor;
