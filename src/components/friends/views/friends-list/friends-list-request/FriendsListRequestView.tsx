import { FC } from 'react';
import { MessengerRequest } from '../../../../../api';
import { FriendRequestRow } from './friendRequestRows';
import { FriendsListRequestItemView } from './FriendsListRequestItemView';

interface FriendsListRequestViewProps {
    rows: FriendRequestRow[];
    onAccept: (request: MessengerRequest) => void;
    onDecline: (request: MessengerRequest) => void;
}

export const FriendsListRequestView: FC<FriendsListRequestViewProps> = ({ rows, onAccept, onDecline }) => (
    <div className="hfl-requests">
        <div className="hfl-request-list">
            {rows.map((row, index) => (
                <FriendsListRequestItemView
                    key={row.request.id}
                    request={row.request}
                    state={row.state}
                    odd={index % 2 === 1}
                    onAccept={onAccept}
                    onDecline={onDecline}
                />
            ))}
        </div>
    </div>
);
