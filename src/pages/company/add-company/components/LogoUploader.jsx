import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import ImageUploader from "../../../../components/ImageUploader.jsx";

export default function LogoUploader({ control, name = "logo", label = "Company Logo" }) {
  return <Controller control={control} name={name} render={({ field }) => <LogoField label={label} file={field.value} onChange={field.onChange} />} />;
}

function LogoField({ label, file, onChange }) {
  const [previewUrl, setPreviewUrl] = useState("");

  // Keeps the preview in sync when the form resets the file externally
  // (e.g. after a successful submit clears the whole form).
  useEffect(() => {
    if (!file) setPreviewUrl("");
  }, [file]);

  return (
    <ImageUploader
      label={label}
      hint="PNG or JPG, up to 2MB"
      shape="wide"
      value={previewUrl}
      onChange={(dataUrl, selectedFile) => {
        setPreviewUrl(dataUrl);
        onChange(selectedFile);
      }}
      onRemove={() => {
        setPreviewUrl("");
        onChange(null);
      }}
    />
  );
}
