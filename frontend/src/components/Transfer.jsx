import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

const Transfer = () => {
  const [formData, setFormData] = useState({
    to: '',
    amount: '',
    recipientBankCode: ''
  });
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/transaction/initiate', {
        ...formData
      });

      setMessage('Transfer initiated successfully!');
      setSuccessData(response.data);
      setShowModal(true);
      setFormData({ to: '', amount: '', recipientBankCode: '' });
    } catch (err) {
      setMessage('Transfer failed: ' + err.response?.data?.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Transfer Funds</h2>
        {message && <p className={`mb-4 ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Recipient Account</label>
            <input
              type="text"
              name="to"
              value={formData.to}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700">Bank Code (leave empty for internal)</label>
            <input
              type="text"
              name="recipientBankCode"
              value={formData.recipientBankCode}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
            Transfer
          </button>
        </form>
        <button onClick={() => navigate('/')} className="w-full mt-4 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600">
          Back to Dashboard
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-semibold">Transfer Successful</h3>
                <p className="text-sm text-gray-600">Your transfer was completed successfully.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-gray-50 p-4">
                {/* <pre className="mt-2 overflow-x-auto text-sm text-gray-700 whitespace-pre-wrap break-words">
{JSON.stringify(successData, null, 2)}
                </pre> */}
                <p className="text-2xl font-bold mb-6 text-green-500">Amount: {successData.tx.amount}</p>
                <p className="text-2xl font-bold mb-6 text-green-500">From: {successData.tx.from}</p>
                <p className="text-2xl font-bold mb-6 text-green-500">Recipent: {successData.tx.to}</p>
                <p className="text-2xl font-bold mb-6 text-green-500">Type: {successData.tx.type}</p>

              </div>
              {successData?.message && (
                <div className="rounded-lg bg-green-50 p-4 text-green-800">
                  {successData.message}
                </div>
              )}
            </div>

            <div className="mt-6 text-right">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-5 py-2 text-white hover:bg-blue-600"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfer;