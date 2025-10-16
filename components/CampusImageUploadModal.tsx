// src/components/CampusImageUploadModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { CampusPlace } from '../types';
import Spinner from './Spinner';
import { XCircleIcon, ImageIcon, TrashIcon } from './icons';

interface CampusImageUploadModalProps {
  place: CampusPlace;
  onClose: () => void;
  onSuccess: () => void; // To refetch data on the main page
}

const CampusImageUploadModal: React.FC<CampusImageUploadModalProps> = ({
  place,
  onClose,
  onSuccess,
}) => {
  const [images, setImages] = useState<any[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('campus_place_images')
        .select('*')
        .eq('place_id', place.id)
        .order('created_at', { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setImages(data || []);
        setPreviews(data.map((img) => img.image_url));
      }
      setLoading(false);
    };

    fetchImages();
  }, [place.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFilesToUpload((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const urlToRemove = previews[index];

    // Check if it's an existing image from the DB
    const existingImage = images.find((img) => img.image_url === urlToRemove);
    if (existingImage) {
      setIdsToDelete((prev) => [...prev, existingImage.id]);
    } else {
      // It's a new file that hasn't been uploaded yet
      const fileIndex = previews
        .slice(0, index)
        .filter((p) => p.startsWith('blob:')).length;
      setFilesToUpload((prev) => prev.filter((_, i) => i !== fileIndex));
    }

    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // 1. Delete marked images
      if (idsToDelete.length > 0) {
        const imagesToDelete = images.filter((img) => idsToDelete.includes(img.id));
        const imagePaths = imagesToDelete.map(
          (img) => img.image_url.substring(img.image_url.lastIndexOf('/campus-place-images/') + 20)
        );
        if (imagePaths.length > 0) {
          await supabase.storage.from('campus-place-images').remove(imagePaths);
        }
        await supabase.from('campus_place_images').delete().in('id', idsToDelete);
      }

      // 2. Upload new images
      if (filesToUpload.length > 0) {
        const uploadPromises = filesToUpload.map(async (file) => {
          const filePath = `${place.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('campus-place-images')
            .upload(filePath, file);
          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('campus-place-images').getPublicUrl(filePath);
          return data.publicUrl;
        });

        const newImageUrls = await Promise.all(uploadPromises);
        const newImageRecords = newImageUrls.map((url) => ({ place_id: place.id, image_url: url }));
        await supabase.from('campus_place_images').insert(newImageRecords);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-tertiary-light dark:border-tertiary">
          <h2 className="text-xl font-bold">Manage Images for {place.name}</h2>
          <button onClick={onClose}>
            <XCircleIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" />
          </button>
        </header>

        <main className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <Spinner />
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {previews.map(
                (preview, index) =>
                  !idsToDelete.includes(images.find((i) => i.image_url === preview)?.id) && (
                    <div key={preview} className="relative group aspect-square">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center aspect-square text-sm p-2 rounded bg-tertiary-light dark:bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-600 border-2 border-dashed border-tertiary-light dark:border-gray-600"
              >
                <ImageIcon className="w-10 h-10" />
                <span>Add Image</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                hidden
              />
            </div>
          )}
        </main>

        <footer className="flex justify-end space-x-4 p-4 border-t border-tertiary-light dark:border-tertiary">
          <button
            onClick={onClose}
            className="py-2 px-6 rounded-full hover:bg-tertiary-light/60 dark:hover:bg-tertiary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="py-2 px-6 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50"
          >
            {isSaving ? <Spinner /> : 'Save Changes'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CampusImageUploadModal;
