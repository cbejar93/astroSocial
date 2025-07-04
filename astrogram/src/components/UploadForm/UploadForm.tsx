import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import styles from './UploadForm.module.css';

const UploadForm: React.FC = () => {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select an image to upload.');
      return;
    }
    console.log('Uploading:', { caption, file });
    // Upload logic will go here
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <textarea
        placeholder="Caption your cosmic masterpiece..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <button type="submit">Upload</button>
    </form>
  );
};

export default UploadForm;
