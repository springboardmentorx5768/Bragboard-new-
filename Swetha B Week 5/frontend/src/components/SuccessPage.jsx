import React, { useState } from 'react';
import Navbar from './Navbar';
import ShoutOutForm from './ShoutOutForm.jsx';
import ShoutOutFeed from './ShoutOutFeed.jsx';

const SuccessPage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);


  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col bg-cover bg-center"
      style={{ backgroundImage: "url('/201.jpg')" }}
    >


      <Navbar />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-14">
        <div className="text-left mb-4 pb-2">
          <center><h3 className="text-2xl font-bold text-gray-100 mb-1">
            𝐖𝙚𝙡𝙘𝙤𝙢𝙚 𝙩𝙤 𝙩𝙝𝙚 𝐁𝐫𝐚𝐠 𝐁𝐨𝐚𝐫𝐝 👋<break></break>

            !!

          </h3>
            <h3 className="text-xl font-semibold text-gray-100 mb-1">
              𝐓𝐡𝐞 𝐄𝐦𝐩𝐥𝐨𝐲𝐞𝐞 𝐑𝐞𝐜𝐨𝐠𝐧𝐢𝐭𝐢𝐨𝐧 𝐖𝐚𝐥𝐥 </h3>
          </center>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center">
          {/* Left Column: Form */}
          <div className="lg:col-span-5 lg:col-start-2 space-y-6">
            <ShoutOutForm onPostSuccess={() => setRefreshTrigger(prev => prev + 1)} />
          </div>

          {/* Right Column: Feed */}
          <div className="lg:col-span-5">
            <ShoutOutFeed refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div >
  );
};

export default SuccessPage;
