const fs = require('fs');
const path = require('path');

class JsonDB {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.groupsFile = path.join(this.dataDir, 'groups.json');
    
    // 데이터 디렉토리 생성
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // 초기 파일 생성
    this.initFiles();
  }

  initFiles() {
    if (!fs.existsSync(this.usersFile)) {
      fs.writeFileSync(this.usersFile, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(this.groupsFile)) {
      fs.writeFileSync(this.groupsFile, JSON.stringify([], null, 2));
    }
  }

  // 사용자 관련 메서드
  async findUser(query) {
    const users = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
    return users.find(user => {
      return Object.keys(query).every(key => user[key] === query[key]);
    });
  }

  async createUser(userData) {
    const users = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
    const newUser = {
      _id: Date.now().toString(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.push(newUser);
    fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
    return newUser;
  }

  async updateUser(id, updateData) {
    const users = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
    const index = users.findIndex(user => user._id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updateData, updatedAt: new Date() };
      fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
      return users[index];
    }
    return null;
  }

  // 그룹 관련 메서드
  async findGroup(query) {
    const groups = JSON.parse(fs.readFileSync(this.groupsFile, 'utf8'));
    return groups.find(group => {
      return Object.keys(query).every(key => group[key] === query[key]);
    });
  }

  async createGroup(groupData) {
    const groups = JSON.parse(fs.readFileSync(this.groupsFile, 'utf8'));
    const newGroup = {
      _id: Date.now().toString(),
      ...groupData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    groups.push(newGroup);
    fs.writeFileSync(this.groupsFile, JSON.stringify(groups, null, 2));
    return newGroup;
  }

  async findGroups(query) {
    const groups = JSON.parse(fs.readFileSync(this.groupsFile, 'utf8'));
    if (!query || Object.keys(query).length === 0) {
      return groups;
    }
    return groups.filter(group => {
      return Object.keys(query).every(key => {
        if (Array.isArray(query[key])) {
          return query[key].includes(group[key]);
        }
        return group[key] === query[key];
      });
    });
  }

  async updateGroup(id, updateData) {
    const groups = JSON.parse(fs.readFileSync(this.groupsFile, 'utf8'));
    const index = groups.findIndex(group => group._id === id);
    if (index !== -1) {
      groups[index] = { ...groups[index], ...updateData, updatedAt: new Date() };
      fs.writeFileSync(this.groupsFile, JSON.stringify(groups, null, 2));
      return groups[index];
    }
    return null;
  }

  // 연결 메서드 (호환성을 위해)
  async connect() {
    console.log('📁 JSON Database connected!');
    return true;
  }
}

module.exports = new JsonDB();