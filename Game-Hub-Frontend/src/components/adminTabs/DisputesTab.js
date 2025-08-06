import { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Skeleton from "@mui/material/Skeleton";
import { toast } from "react-toastify";
import { socket } from "../../utils/socket"; // Make sure this exports an initialized socket.io-client

const DisputesTab = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all disputed trades
  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/disputes");
      setDisputes(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();

    // Listen for newly created disputes
    socket.on("admin:dispute_created", (data) => {
      toast.info("New dispute opened");
      fetchDisputes();
    });

    // Listen for resolved disputes to refresh UI
    socket.on("admin:dispute_resolved", (data) => {
      toast.success("Dispute resolved");
      fetchDisputes();
    });

    return () => {
      socket.off("admin:dispute_created");
      socket.off("admin:dispute_resolved");
    };
  }, []);

  const handleResolve = async (id, action) => {
    const note = prompt(`Enter note for ${action}:`);
    if (!note) return;

    try {
      await axios.post(`/admin/disputes/${id}/resolve`, { action, note });
      toast.success("Dispute resolved");
      fetchDisputes();
    } catch (err) {
      toast.error("Failed to resolve dispute");
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="rectangular" height={40} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (disputes.length === 0) {
    return <p className="text-gray-400">No disputes found</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {disputes.map((tx) => (
        <Card key={tx._id}>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-300">
              <strong>Post:</strong> {tx.post?.description || "N/A"}
            </p>
            <p className="text-sm text-gray-300">
              <strong>Amount:</strong> {tx.amount} coins
            </p>
            <p className="text-sm text-gray-300">
              <strong>Buyer:</strong> {tx.buyer?.username}
            </p>
            <p className="text-sm text-gray-300">
              <strong>Seller:</strong> {tx.seller?.username}
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="destructive"
                onClick={() => handleResolve(tx._id, "refund")}
              >
                Refund Buyer
              </Button>
              <Button
                onClick={() => handleResolve(tx._id, "release")}
                className="bg-green-600 hover:bg-green-700"
              >
                Release to Seller
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DisputesTab;
