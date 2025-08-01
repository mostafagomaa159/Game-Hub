import { useEffect, useState } from "react";
import { getPosts, deletePost } from "../api/posts";

function PostList() {
  const [posts, setPosts] = useState([]);

  const loadPosts = async () => {
    try {
      const res = await getPosts();
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    await deletePost(id);
    loadPosts();
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div>
      <h3>All Posts</h3>
      {posts.map((post) => (
        <div key={post._id}>
          <h4>{post.title}</h4>
          <p>{post.content}</p>
          <button onClick={() => handleDelete(post._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default PostList;
