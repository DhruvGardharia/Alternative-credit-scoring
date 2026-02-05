import { uploadStatement } from "../services/api";

export default function UploadStatement({ user, setSummary }) {
  const upload = async (e) => {
    const formData = new FormData();
    formData.append("statement", e.target.files[0]);
    formData.append("userId", user._id);

    const res = await uploadStatement(formData);
    setSummary(res.data.summary);
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 shadow rounded">
      <h2 className="text-xl font-semibold mb-4">
        Upload Bank Statement
      </h2>

      <input type="file" onChange={upload} />

      <p className="text-sm text-gray-500 mt-3">
        We analyze financial patterns, not individual transactions.
      </p>
    </div>
  );
}
