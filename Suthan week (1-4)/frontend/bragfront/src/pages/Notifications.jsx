import React from 'react';
import ReceivedShoutouts from '../components/ReceivedShoutouts';

const Notifications = () => {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    Shout-Outs for You
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                    See all the appreciation you've received from your team
                </p>
            </div>

            {/* Received Shoutouts Component */}
            <ReceivedShoutouts />
        </div>
    );
};

export default Notifications;
