import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Transfer = () => {
  const [formData, setFormData] = useState({
    to: '',
    amount: '',
    recipientBankCode: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/transaction/initiate', {
        ...formData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Transfer initiated successfully!');
      setFormData({ to: '', amount: '', recipientBankCode: '' });
    } catch (err) {
      setMessage('Transfer failed: ' + err.response?.data?.message);
    }
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
    </div>
  );
};

export default Transfer;