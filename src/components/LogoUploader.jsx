import { useState } from "react";
import { Controller } from "react-hook-form";
import ImageUploader from "./ImageUploader.jsx";

export default function LogoUploader({ control, name = "logo", label = "Company Logo", hint, initialPreviewUrl = "", onRemove }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <LogoField
          label={label}
          hint={hint}
          file={field.value}
          initialPreviewUrl={initialPreviewUrl}
          onChange={field.onChange}
          onRemove={onRemove}
        />
      )}
    />
  );
}

function LogoField({ label, hint, initialPreviewUrl, onChange, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl);

  return (
    <ImageUploader
      label={label}
      hint={hint ?? "PNG, JPG or SVG, up to 2MB"}
      shape="wide"
      value={previewUrl}
      onChange={(dataUrl, selectedFile) => {
        setPreviewUrl(dataUrl);
        onChange(selectedFile);
      }}
      onRemove={() => {
        setPreviewUrl("");
        onChange(null);
        onRemove?.();
      }}
    />
  );
}
