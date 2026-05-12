import connectDB from '@/lib/mongodb';
import ReturnRequest from '@/models/ReturnRequest';
import Store from '@/models/Store';
import { NextResponse } from "next/server";
import { requireFirebaseAuth } from '@/lib/firebase-auth-helper';

// Update return/replacement request status
export async function PUT(request, { params }) {
    try {
        await connectDB();

        let userId;
        try {
            const user = await requireFirebaseAuth(request);
            userId = user.uid;
        } catch (err) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        const { id } = params;
        const { status } = await request.json();

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        // Verify user owns the store for this request
        const returnRequest = await ReturnRequest.findById(id)
            .populate('storeId')
            .lean();

        if (!returnRequest) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        if (returnRequest.storeId.userId !== userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        // Update request status
        const updatedRequest = await ReturnRequest.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).lean();

        return NextResponse.json({ 
            message: "Request status updated successfully",
            request: { ...updatedRequest, _id: updatedRequest._id.toString() } 
        });
    } catch (error) {
        console.error('Error updating return request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
