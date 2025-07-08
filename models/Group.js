const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female']
  },
  university: {
    type: String,
    required: true
  },
  availableTimeSlots: [{
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  }],
  isLookingForMatch: {
    type: Boolean,
    default: false
  },
  currentMatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  status: {
    type: String,
    enum: ['forming', 'ready', 'matching', 'matched', 'completed'],
    default: 'forming'
  }
}, {
  timestamps: true
});

// 그룹이 가득 찼는지 확인하는 메소드
GroupSchema.methods.isFull = function() {
  return this.members.length >= 3;
};

// 그룹이 매칭 준비가 되었는지 확인하는 메소드
GroupSchema.methods.isReadyForMatching = function() {
  return this.members.length === 3 && this.availableTimeSlots.length > 0;
};

module.exports = mongoose.model('Group', GroupSchema);