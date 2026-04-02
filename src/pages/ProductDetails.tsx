import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from '../firebase';
import { useAuth } from '../AuthContext';
import { Package, ShieldCheck, AlertTriangle, Clock, Link as LinkIcon, Star, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const { profile, user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      const docRef = doc(db, 'products', id);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          setProduct(null);
        }
        setLoading(false);
      });

      const qEvents = query(collection(db, 'events'), where('productId', '==', id));
      const unsubEvents = onSnapshot(qEvents, (snapshot) => {
        const evts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        evts.sort((a, b) => {
          const timeA = a.timestamp?.toMillis() || 0;
          const timeB = b.timestamp?.toMillis() || 0;
          return timeB - timeA;
        });
        setEvents(evts);
      });

      const qReviews = query(collection(db, 'reviews'), where('productId', '==', id));
      const unsubReviews = onSnapshot(qReviews, (snapshot) => {
        const revs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        revs.sort((a, b) => {
          const timeA = a.timestamp?.toMillis() || 0;
          const timeB = b.timestamp?.toMillis() || 0;
          return timeB - timeA;
        });
        setReviews(revs);
      });

      return () => {
        unsubscribe();
        unsubEvents();
        unsubReviews();
      };
    };

    fetchProduct();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user || !id) return;

    try {
      await addDoc(collection(db, 'reviews'), {
        id: `rev-${Date.now()}`,
        productId: id,
        consumerId: user.uid,
        consumerName: profile.name,
        rating: newReview.rating,
        comment: newReview.comment,
        timestamp: serverTimestamp()
      });
      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      console.error("Error adding review:", error);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading product data...</div>;
  if (!product) return <div className="p-8 text-center text-red-500">Product not found.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Product Header */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h3 className="text-2xl leading-6 font-bold text-gray-900 flex items-center">
              <Package className="mr-2 h-6 w-6 text-indigo-500" />
              {product.name}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              ID: {product.id} | Producer: {product.producerName}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
              ${product.status === 'approved' ? 'bg-green-100 text-green-800' : 
                product.status === 'flagged' || product.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
              {product.status.toUpperCase()}
            </span>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-500 mr-2">Risk Score:</span>
              <span className={`font-bold ${product.riskScore > 50 ? 'text-red-600' : 'text-green-600'}`}>
                {product.riskScore}/100
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.category}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Registration Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {product.createdAt ? format(product.createdAt.toDate(), 'PPpp') : 'Pending'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Packaging Type</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{product.packagingType || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Weight & Size</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.weight || 'N/A'} / {product.size || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.description}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Blockchain Timeline */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
          <LinkIcon className="mr-2 h-5 w-5 text-indigo-500" />
          Immutable Audit Trail
        </h3>
        <div className="flow-root">
          <ul className="-mb-8">
            {events.map((event, eventIdx) => (
              <li key={event.id}>
                <div className="relative pb-8">
                  {eventIdx !== events.length - 1 ? (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                        ${event.type === 'CREATED' ? 'bg-green-500' : 
                          event.type === 'HANDOFF' ? 'bg-blue-500' : 
                          event.type === 'INSPECTION' ? 'bg-purple-500' : 'bg-gray-500'}`}>
                        {event.type === 'CREATED' ? <Package className="h-4 w-4 text-white" /> :
                         event.type === 'HANDOFF' ? <Clock className="h-4 w-4 text-white" /> :
                         <ShieldCheck className="h-4 w-4 text-white" />}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">{event.type}</span> by{' '}
                          <span className="font-medium text-gray-900">{event.actorName}</span> ({event.actorRole})
                        </p>
                        <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100">
                          {Object.entries(event.data).map(([k, v]) => (
                            <div key={k}><span className="font-medium capitalize">{k}:</span> {String(v)}</div>
                          ))}
                          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-400 font-mono break-all">
                            Hash: {event.hash}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {event.timestamp ? format(event.timestamp.toDate(), 'MMM d, h:mm a') : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
          <MessageSquare className="mr-2 h-5 w-5 text-indigo-500" />
          Consumer Reviews & Reports
        </h3>
        
        {profile?.role === 'consumer' && (
          <form onSubmit={handleSubmitReview} className="mb-8 bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Leave a Review or Report Issue</h4>
            <div className="flex items-center mb-2">
              <span className="text-sm text-gray-700 mr-2">Rating:</span>
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  className={`h-5 w-5 cursor-pointer ${star <= newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  onClick={() => setNewReview({...newReview, rating: star})}
                />
              ))}
            </div>
            <textarea
              required
              value={newReview.comment}
              onChange={e => setNewReview({...newReview, comment: e.target.value})}
              placeholder="Share your experience or report an issue..."
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                Submit
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">{review.consumerName}</span>
                <span className="text-xs text-gray-500">
                  {review.timestamp ? format(review.timestamp.toDate(), 'PP') : ''}
                </span>
              </div>
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-sm text-gray-700">{review.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
        </div>
      </div>
    </div>
  );
}
