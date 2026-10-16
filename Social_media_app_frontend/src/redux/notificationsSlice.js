import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../axiosCalls/axios";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/notifications");
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load notifications."
      );
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch("/notifications/read-all");
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark notifications as read."
      );
    }
  }
);

export const markSingleAsRead = createAsyncThunk(
  "notifications/markSingleAsRead",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/notifications/${id}/read`);
      return { id, data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark notification as read."
      );
    }
  }
);

export const deleteNotificationById = createAsyncThunk(
  "notifications/deleteById",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete notification."
      );
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: "",
    liveToast: null
  },
  reducers: {
    addLiveNotification: (state, action) => {
      const notification = action.payload;
      // Add to beginning of items
      state.items.unshift(notification);
      state.unreadCount += 1;
      state.liveToast = notification;
    },
    clearLiveToast: (state) => {
      state.liveToast = null;
    },
    resetNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
      state.loading = false;
      state.error = "";
      state.liveToast = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.notifications || [];
        state.unreadCount = action.payload.unreadCount || 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // markAllAsRead
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.unreadCount = 0;
        state.items.forEach((item) => {
          item.read = true;
        });
      })
      // markSingleAsRead
      .addCase(markSingleAsRead.fulfilled, (state, action) => {
        const item = state.items.find((i) => i._id === action.payload.id);
        if (item && !item.read) {
          item.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // deleteNotificationById
      .addCase(deleteNotificationById.fulfilled, (state, action) => {
        const removed = state.items.find((i) => i._id === action.payload);
        if (removed && !removed.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.items = state.items.filter((i) => i._id !== action.payload);
      });
  }
});

export const { addLiveNotification, clearLiveToast, resetNotifications } =
  notificationsSlice.actions;

export default notificationsSlice.reducer;
