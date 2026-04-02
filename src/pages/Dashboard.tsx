import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db, collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, onSnapshot, setDoc } from '../firebase';
import { Package, Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';

export default function Dashboard() {
  const { profile } = useAuth();

  if (!profile) return null;

  switch (profile.role) {
    case 'producer':
      return <ProducerDashboard />;
    case 'distributor':
      return <DistributorDashboard />;
    case 'regulator':
      return <RegulatorDashboard />;
    case 'consumer':
      return <ConsumerDashboard />;
    default:
      return <div>Unknown role</div>;
  }
}

function ProducerDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', category: '', packagingType: 'item', weight: '', size: '' });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), where('producerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleRegisterProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    const uniqueId = `${profile.companyPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;
    
    try {
      // 1. Create Product
      await setDoc(doc(db, 'products', uniqueId), {
        id: uniqueId,
        producerId: user.uid,
        producerName: profile.companyName || profile.name,
        name: newProduct.name,
        description: newProduct.description,
        category: newProduct.category,
        packagingType: newProduct.packagingType,
        weight: newProduct.weight,
        size: newProduct.size,
        status: 'registered',
        riskScore: 0,
        createdAt: serverTimestamp()
      });

      // 2. Create Genesis Event (Blockchain)
      const eventData = {
        id: `evt-${Date.now()}`,
        productId: uniqueId,
        type: 'CREATED',
        actorId: user.uid,
        actorName: profile.companyName || profile.name,
        actorRole: profile.role,
        timestamp: serverTimestamp(),
        data: { location: 'Producer Facility', notes: 'Product registered', packagingType: newProduct.packagingType, weight: newProduct.weight, size: newProduct.size },
        previousHash: '0',
      };
      
      const hash = CryptoJS.SHA256(JSON.stringify(eventData)).toString();
      await setDoc(doc(db, 'events', eventData.id), { ...eventData, hash });

      setShowAdd(false);
      setNewProduct({ name: '', description: '', category: '', packagingType: 'item', weight: '', size: '' });
    } catch (error) {
      console.error("Error registering product:", error);
      alert("Failed to register product.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Producer Dashboard</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Register Product
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-medium mb-4">Register New Product</h2>
          
          {['meat', 'dairy', 'seafood', 'poultry'].some(c => newProduct.category.toLowerCase().includes(c)) && (
            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Statistical Alert:</strong> Products in this category have a historically high risk of temperature compliance issues. Please ensure strict cold-chain monitoring.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleRegisterProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input type="text" required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Packaging Type</label>
                <select value={newProduct.packagingType} onChange={e => setNewProduct({...newProduct, packagingType: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="item">Singular Item</option>
                  <option value="box">Box / Group</option>
                  <option value="pallet">Pallet</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Weight (e.g., 5kg)</label>
                <input type="text" value={newProduct.weight} onChange={e => setNewProduct({...newProduct, weight: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Size (e.g., 10x10x10 cm)</label>
                <input type="text" value={newProduct.size} onChange={e => setNewProduct({...newProduct, size: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" rows={3} />
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Register</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {products.map((product) => (
            <li key={product.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">{product.name}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${product.status === 'registered' ? 'bg-green-100 text-green-800' : 
                        product.status === 'flagged' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {product.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <Package className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      ID: {product.id}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <AlertTriangle className={`flex-shrink-0 mr-1.5 h-4 w-4 ${product.riskScore > 50 ? 'text-red-500' : 'text-gray-400'}`} />
                    <p>Risk Score: {product.riskScore}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {products.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">No products registered yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function DistributorDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    // Show products that are in transit or registered
    const q = query(collection(db, 'products'), where('status', 'in', ['registered', 'in-transit']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleHandoff = async (productId: string, currentScore: number) => {
    if (!profile || !user) return;
    const temp = Math.floor(Math.random() * 30); // Simulated temp
    const humidity = Math.floor(Math.random() * 100);
    
    let riskIncrease = 0;
    if (temp > 25 || temp < 2) riskIncrease += 20; // Simulated risk logic
    if (humidity > 80) riskIncrease += 10;

    const newScore = Math.min(100, currentScore + riskIncrease);
    const newStatus = newScore > 50 ? 'flagged' : 'in-transit';

    try {
      await updateDoc(doc(db, 'products', productId), {
        status: newStatus,
        riskScore: newScore
      });

      // Get last event for hash
      const eventsQ = query(collection(db, 'events'), where('productId', '==', productId));
      const eventsSnap = await getDocs(eventsQ);
      const sortedEvents = eventsSnap.docs.map(d => d.data()).sort((a, b) => b.timestamp - a.timestamp);
      const previousHash = sortedEvents.length > 0 ? sortedEvents[0].hash : '0';

      const eventData = {
        id: `evt-${Date.now()}`,
        productId,
        type: 'HANDOFF',
        actorId: user.uid,
        actorName: profile.companyName || profile.name,
        actorRole: profile.role,
        timestamp: serverTimestamp(),
        data: { temperature: temp, humidity, location: 'Distributor Hub' },
        previousHash,
      };
      
      const hash = CryptoJS.SHA256(JSON.stringify(eventData)).toString();
      await setDoc(doc(db, 'events', eventData.id), { ...eventData, hash });

      if (newStatus === 'flagged') {
        const productDoc = await getDocs(query(collection(db, 'products'), where('id', '==', productId)));
        if (!productDoc.empty) {
          const prodData = productDoc.docs[0].data();
          await setDoc(doc(db, 'notifications', `notif-${Date.now()}`), {
            id: `notif-${Date.now()}`,
            userId: prodData.producerId,
            title: 'Risk Alert',
            message: `Product ${productId} has been flagged due to high risk score during distribution.`,
            read: false,
            type: 'RISK_ALERT',
            timestamp: serverTimestamp()
          });
        }
      }

      alert(`Handoff logged. Temp: ${temp}°C, Humidity: ${humidity}%. Risk Score: ${newScore}`);
    } catch (error) {
      console.error("Error logging handoff:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Distributor Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium mb-4">Accept Product</h2>
        <div className="flex space-x-4">
          <input 
            type="text" 
            placeholder="Enter Product ID (e.g., CCA-12345)" 
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
          />
          <button onClick={() => navigate(`/product/${searchId}`)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Search
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Active Shipments</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {products.map((product) => (
            <li key={product.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div className="cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                <p className="text-sm font-medium text-indigo-600">{product.name} ({product.id})</p>
                <p className="text-xs text-gray-500 mt-1">Status: {product.status} | Risk: {product.riskScore}</p>
              </div>
              <button 
                onClick={() => handleHandoff(product.id, product.riskScore)}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium hover:bg-green-200"
              >
                Log Handoff & Conditions
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RegulatorDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [flaggedProducts, setFlaggedProducts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('status', '==', 'flagged'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFlaggedProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleDecision = async (productId: string, decision: 'approved' | 'rejected') => {
    if (!profile || !user) return;
    try {
      await updateDoc(doc(db, 'products', productId), {
        status: decision,
        riskScore: decision === 'approved' ? 0 : 100
      });

      const eventsQ = query(collection(db, 'events'), where('productId', '==', productId));
      const eventsSnap = await getDocs(eventsQ);
      const sortedEvents = eventsSnap.docs.map(d => d.data()).sort((a, b) => b.timestamp - a.timestamp);
      const previousHash = sortedEvents.length > 0 ? sortedEvents[0].hash : '0';

      const eventData = {
        id: `evt-${Date.now()}`,
        productId,
        type: 'INSPECTION',
        actorId: user.uid,
        actorName: profile.name,
        actorRole: profile.role,
        timestamp: serverTimestamp(),
        data: { decision, notes: `Regulatory inspection resulted in: ${decision}` },
        previousHash,
      };
      
      const hash = CryptoJS.SHA256(JSON.stringify(eventData)).toString();
      await setDoc(doc(db, 'events', eventData.id), { ...eventData, hash });

      const productDoc = await getDocs(query(collection(db, 'products'), where('id', '==', productId)));
      if (!productDoc.empty) {
        const prodData = productDoc.docs[0].data();
        await setDoc(doc(db, 'notifications', `notif-${Date.now()}`), {
          id: `notif-${Date.now()}`,
          userId: prodData.producerId,
          title: 'Compliance Update',
          message: `Product ${productId} has been ${decision} by regulatory oversight.`,
          read: false,
          type: 'COMPLIANCE',
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error logging decision:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Regulatory Oversight</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Flagged Products Requiring Attention
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {flaggedProducts.map((product) => (
            <li key={product.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div className="cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                <p className="text-sm font-medium text-red-600">{product.name} ({product.id})</p>
                <p className="text-xs text-gray-500 mt-1">Producer: {product.producerName} | Risk Score: {product.riskScore}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleDecision(product.id, 'approved')} className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium hover:bg-green-200">Approve</button>
                <button onClick={() => handleDecision(product.id, 'rejected')} className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm font-medium hover:bg-red-200">Reject/Destroy</button>
              </div>
            </li>
          ))}
          {flaggedProducts.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">No flagged products at this time.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function ConsumerDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 text-center py-12">
      <h1 className="text-3xl font-bold text-gray-900">Welcome to TrustChain</h1>
      <p className="text-gray-600 max-w-2xl mx-auto">
        Verify the authenticity and history of your products using our immutable blockchain-style ledger.
      </p>
      <button
        onClick={() => navigate('/verify')}
        className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
      >
        <Package className="mr-2 h-5 w-5" />
        Verify a Product Now
      </button>
    </div>
  );
}
