import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { db, doc, updateDoc } from '../firebase';
import { User, Shield, FileText } from 'lucide-react';

export default function Profile() {
  const { profile, user, setProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    companyName: profile?.companyName || '',
    phoneNumber: profile?.phoneNumber || '',
  });

  if (!profile || !user) return null;

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        companyName: formData.companyName,
        phoneNumber: formData.phoneNumber,
      });
      setProfile({ ...profile, ...formData });
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const toggle2FA = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        twoFactorEnabled: !profile.twoFactorEnabled
      });
      setProfile({ ...profile, twoFactorEnabled: !profile.twoFactorEnabled });
    } catch (error) {
      console.error("Error toggling 2FA:", error);
    }
  };

  const simulateDocUpload = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        documentsVerified: true
      });
      setProfile({ ...profile, documentsVerified: true });
      alert("Documents uploaded and verified successfully.");
    } catch (error) {
      console.error("Error verifying docs:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <User className="mr-2 h-5 w-5 text-indigo-500" />
              Profile Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and application settings.</p>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Edit
            </button>
          ) : (
            <div className="flex space-x-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                Save
              </button>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {editing ? (
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="border border-gray-300 rounded px-2 py-1 w-full" />
                ) : profile.name}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">{profile.role}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.email}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {editing ? (
                  <input type="text" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="border border-gray-300 rounded px-2 py-1 w-full" />
                ) : (profile.phoneNumber || 'Not provided')}
              </dd>
            </div>
            {(profile.role === 'producer' || profile.role === 'distributor') && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {editing ? (
                    <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="border border-gray-300 rounded px-2 py-1 w-full" />
                  ) : profile.companyName}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Shield className="mr-2 h-5 w-5 text-indigo-500" />
            Security & Verification
          </h3>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication (2FA)</h4>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
              </div>
              <button
                onClick={toggle2FA}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${profile.twoFactorEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${profile.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Document Verification</h4>
                <p className="text-sm text-gray-500">
                  {profile.documentsVerified ? 'Your identity/company documents have been verified.' : 'Please upload government/company documents for verification.'}
                </p>
              </div>
              {!profile.documentsVerified && (
                <button onClick={simulateDocUpload} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Docs
                </button>
              )}
              {profile.documentsVerified && (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
