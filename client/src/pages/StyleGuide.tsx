import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';

const StyleGuide: React.FC = () => {
  const [page, setPage] = useState(2);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <header>
        <h1 className="text-3xl font-bold">Design Language Style Guide</h1>
        <p className="text-secondary-600 mt-2">Visual tokens, typography, components, and accessibility examples.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Form Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Title" placeholder="Enter title" required helperText="Keep it concise and descriptive." />
          <Input label="Email" type="email" placeholder="author@university.edu" error="Please enter a valid email" />
          <Select label="Manuscript Type" options={[
            { label: 'Select type', value: '' },
            { label: 'Research Article', value: 'research-article' },
            { label: 'Review Article', value: 'review' },
          ]} />
          <Textarea label="Abstract" rows={5} placeholder="250-300 words" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Alerts</h2>
        <div className="space-y-3">
          <Alert title="Heads up" variant="neutral">This is a neutral message.</Alert>
          <Alert title="Information" variant="info">Double-blind review is enabled for all submissions.</Alert>
          <Alert title="Success" variant="success">Your manuscript was submitted successfully.</Alert>
          <Alert title="Warning" variant="warning">Please resolve formatting issues before final submission.</Alert>
          <Alert title="Error" variant="error">We couldn't upload the file. Try a smaller file or a supported format.</Alert>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Badges & Cards</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Draft</Badge>
          <Badge variant="info">Submitted</Badge>
          <Badge variant="warning">Under review</Badge>
          <Badge variant="success">Accepted</Badge>
          <Badge variant="error">Rejected</Badge>
        </div>
        <div className="card mt-4">
          <div className="card-header"><h3 className="font-semibold">Card Header</h3></div>
          <div className="card-body prose">
            <p>Cards are used to group related content. Typography uses a serif face for headings and a readable sans for body text. <a href="#">Learn more</a>.</p>
          </div>
          <div className="card-footer">Card Footer</div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Pagination</h2>
        <Pagination page={page} totalPages={9} onPageChange={setPage} />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Accessibility</h2>
        <p className="text-secondary-600">Try navigating with keyboard: Tab to focus, Enter/Space to activate. Components expose ARIA attributes where relevant. Focus rings use the primary color.</p>
        <a className="inline-block" href="#main-content">Skip to main content example link</a>
      </section>
    </div>
  );
};

export default StyleGuide;
