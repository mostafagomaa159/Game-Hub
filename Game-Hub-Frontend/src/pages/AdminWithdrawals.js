// import React, { useEffect, useState } from "react";
// import api from "../services/api";
// import TransactionCard from "../components/TransactionCard";

// const AdminWithdrawals = () => {
//   const [withdrawals, setWithdrawals] = useState([]);
//   const [page, setPage] = useState(1);
//   const [refresh, setRefresh] = useState(false);

//   useEffect(() => {
//     // Move fetchData inside useEffect to fix ESLint warning
//     const fetchData = async () => {
//       try {
//         const res = await api.get(`/transactions/withdrawals?page=${page}`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         });
//         setWithdrawals(res.data.transactions || res.data.data || []);
//       } catch (err) {
//         console.error(err);
//       }
//     };

//     fetchData();
//   }, [page, refresh]);

//   const handleAction = async (id, status) => {
//     const note = prompt(`Add a note for ${status} decision:`);
//     if (note === null) return; // User cancelled prompt
//     try {
//       await api.patch(
//         `/transactions/${id}/approve`,
//         { status, adminNote: note },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );
//       setRefresh((prev) => !prev);
//     } catch (err) {
//       alert("Error processing transaction");
//       console.error(err);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-black text-white p-6">
//       <h1 className="text-3xl font-bold mb-4">Admin - Withdrawals</h1>
//       <div className="grid grid-cols-1 gap-4">
//         {withdrawals.length > 0 ? (
//           withdrawals.map((tx) => (
//             <TransactionCard key={tx._id} tx={tx} onAction={handleAction} />
//           ))
//         ) : (
//           <p>No withdrawals found.</p>
//         )}
//       </div>
//       <div className="mt-6 flex justify-center space-x-4">
//         <button
//           onClick={() => setPage((p) => Math.max(1, p - 1))}
//           disabled={page === 1}
//           className="px-4 py-2 bg-zinc-700 rounded disabled:opacity-50"
//         >
//           Prev
//         </button>
//         <button
//           onClick={() => setPage((p) => p + 1)}
//           className="px-4 py-2 bg-zinc-700 rounded"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// };

// export default AdminWithdrawals;
