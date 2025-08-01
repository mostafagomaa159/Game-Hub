import { useState } from "react";
import { createPost } from "../api/posts";

function PostForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPost(title, content);
      setTitle("");
      setContent("");
      onCreated();
    } catch (err) {
      alert("Failed to create post");
    }
  };

  return (
    <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-lg max-w-2xl mx-auto mt-10">
      <h3 className="text-2xl font-semibold mb-4 text-white">
        Create New Post
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="bg-gray-800 text-white px-4 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
          rows={6}
          className="bg-gray-800 text-white px-4 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition duration-300"
        >
          Post
        </button>
      </form>
    </div>
  );
}

export default PostForm;
