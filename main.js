// 1. 초기 데이터 및 상태 설정
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// 뽀모도로 타이머 상태
let timerInterval;
let timeLeft = 25 * 60; // 25분 (초)
let isTimerRunning = false;
let isBreak = false;

// 2. DOM 요소 참조
const todoInput = document.getElementById('todo-input');
const addTodoBtn = document.getElementById('add-todo');
const timerDisplay = document.getElementById('timer');
const startTimerBtn = document.getElementById('start-timer');
const resetTimerBtn = document.getElementById('reset-timer');
const pomodoroStatus = document.getElementById('pomodoro-status');
const dateDisplay = document.getElementById('current-date');
const timeDisplay = document.getElementById('current-time');

// 2.1 실시간 날짜 및 시간 업데이트
const updateDateTime = () => {
  const now = new Date();
  
  // 날짜 형식: 2026년 4월 1일 (수)
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  dateDisplay.textContent = now.toLocaleDateString('ko-KR', dateOptions);
  
  // 24시간 형식 시간: 14:30:05
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
};

setInterval(updateDateTime, 1000);
updateDateTime();

// 카테고리별 리스트 및 카운트 요소
const listElements = {
  study: document.getElementById('list-study'),
  daily: document.getElementById('list-daily'),
  other: document.getElementById('list-other')
};
const countElements = {
  study: document.getElementById('count-study'),
  daily: document.getElementById('count-daily'),
  other: document.getElementById('count-other')
};

// 3. 할 일 관리 기능 (자동 분류 엔진 포함)

// 자동 분류를 위한 키워드 정의
const CATEGORY_KEYWORDS = {
  study: ['공부', '시험', '과제', '강의', '학습', '책', '독서', '영어', '수학', '인강', '토익', '필기', '복습', '예습', '연구'],
  daily: ['운동', '청소', '식사', '쇼핑', '집안일', '세탁', '설거지', '비타민', '요리', '마트', '산책', '수면', '샤워']
};

// 우선순위 판별을 위한 키워드
const PRIORITY_KEYWORDS = {
  high: ['급합', '중요', '반드시', '마감', '오늘까지', '꼭', '긴급'],
  medium: ['중간', '보통', '내일까지']
};

const categorizeTodo = (text) => {
  if (CATEGORY_KEYWORDS.study.some(kw => text.includes(kw))) return 'study';
  if (CATEGORY_KEYWORDS.daily.some(kw => text.includes(kw))) return 'daily';
  return 'other'; // 기본값
};

const determinePriority = (text) => {
  if (PRIORITY_KEYWORDS.high.some(kw => text.includes(kw))) return 'high';
  if (PRIORITY_KEYWORDS.medium.some(kw => text.includes(kw))) return 'medium';
  return 'low'; // 기본값
};

const saveTodos = () => {
  localStorage.setItem('todos', JSON.stringify(todos));
};

const renderTodos = () => {
  // 모든 리스트 초기화
  Object.values(listElements).forEach(el => el.innerHTML = '');
  
  const counts = { study: 0, daily: 0, other: 0 };

  todos.forEach(todo => {
    const category = todo.category || 'other';
    counts[category]++;

    const li = document.createElement('li');
    li.className = `todo-item ${todo.status === 'done' ? 'done' : ''}`;
    
    // 우선순위에 따른 태그 클래스 설정
    const prioLabel = { high: '중요', medium: '보통', low: '낮음' }[todo.priority || 'low'];
    const prioClass = `prio-${todo.priority || 'low'}`;

    li.innerHTML = `
      <div class="todo-main">
        <span class="priority-tag ${prioClass}">${prioLabel}</span>
        <span class="todo-text">${todo.text}</span>
      </div>
      <div class="todo-actions">
        <button class="action-btn toggle-status" data-id="${todo.id}">
          ${todo.status === 'todo' ? '진행 중' : (todo.status === 'progress' ? '완료' : '복구')}
        </button>
        <button class="action-btn delete-btn" data-id="${todo.id}">🗑️</button>
      </div>
    `;

    // 이벤트 리스너 (토글 및 삭제)
    li.querySelector('.toggle-status').addEventListener('click', () => toggleStatus(todo.id));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.id));

    listElements[category].appendChild(li);
  });

  // 카운트 업데이트
  Object.keys(countElements).forEach(key => {
    countElements[key].textContent = counts[key];
  });
};

const addTodo = () => {
  const text = todoInput.value.trim();
  if (!text) return;

  const category = categorizeTodo(text);
  const priority = determinePriority(text);

  const newTodo = {
    id: Date.now(),
    text,
    category,
    priority,
    status: 'todo'
  };

  todos.push(newTodo);
  todoInput.value = '';
  saveTodos();
  renderTodos();
};

const deleteTodo = (id) => {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
};

const toggleStatus = (id) => {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  // 순환 토글: 대기 -> 진행 -> 완료 -> 대기
  if (todo.status === 'todo') todo.status = 'progress';
  else if (todo.status === 'progress') todo.status = 'done';
  else todo.status = 'todo';

  saveTodos();
  renderTodos();
};

// 4. 뽀모도로 타이머 로직 (플로팅 위젯용)
const updateTimerDisplay = () => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const startTimer = () => {
  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    startTimerBtn.textContent = '재개';
  } else {
    isTimerRunning = true;
    startTimerBtn.textContent = '정지';
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        alert(isBreak ? '휴식 종료! 다시 집중하세요.' : '집중 시간 종료! 잠시 쉬세요.');
        toggleTimerMode();
      }
    }, 1000);
  }
};

const toggleTimerMode = () => {
  isBreak = !isBreak;
  timeLeft = isBreak ? 5 * 60 : 25 * 60;
  pomodoroStatus.textContent = isBreak ? '휴식 시간' : '집중 시간';
  updateTimerDisplay();
  startTimerBtn.textContent = '시작';
};

const resetTimer = () => {
  clearInterval(timerInterval);
  isTimerRunning = false;
  isBreak = false;
  timeLeft = 25 * 60;
  pomodoroStatus.textContent = '집중 시간';
  updateTimerDisplay();
  startTimerBtn.textContent = '시작';
};

// 5. 이벤트 바인딩 및 초기화
addTodoBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTodo();
});
startTimerBtn.addEventListener('click', startTimer);
resetTimerBtn.addEventListener('click', resetTimer);

// 6. 오늘의 기분 및 주간 기록 관리 로직
const moodBtns = document.querySelectorAll('.mood-btn');
const daySlots = document.querySelectorAll('.day-slot');

// 요일별 한글 매핑 (일:0, 월:1, 화:2, 수:3, 목:4, 금:5, 토:6)
const dayMap = ['일', '월', '화', '수', '목', '금', '토'];
const currentDay = dayMap[new Date().getDay()]; // 오늘의 요일

// 로컬 스토리지에서 주간 기분 데이터 가져오기
let weeklyMoods = JSON.parse(localStorage.getItem('weeklyMoods')) || {};

// UI 업데이트 전용 함수
const updateWeeklyUI = () => {
  daySlots.forEach(slot => {
    const day = slot.dataset.day;
    const moodEl = slot.querySelector('.day-mood');
    moodEl.textContent = weeklyMoods[day] || '-';
  });

  // 오늘의 버튼 상태 표시 (저장된 이모지와 버튼의 텍스트 비교)
  const todayMood = weeklyMoods[currentDay];
  moodBtns.forEach(btn => {
    btn.classList.toggle('selected', btn.textContent === todayMood);
  });
};

moodBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const selectedMood = btn.textContent; // 이모지를 직접 가져옴
    
    // 오늘의 기분 업데이트
    weeklyMoods[currentDay] = selectedMood;
    
    // 로컬 스토리지 저장
    localStorage.setItem('weeklyMoods', JSON.stringify(weeklyMoods));
    
    // UI 동기화
    updateWeeklyUI();
  });
});

// 삭제 버튼 이벤트 바인딩
document.querySelectorAll('.delete-mood-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // 부모 요소로의 이벤트 전파 방지
    const day = btn.parentElement.dataset.day;
    
    if (weeklyMoods[day]) {
      delete weeklyMoods[day];
      localStorage.setItem('weeklyMoods', JSON.stringify(weeklyMoods));
      updateWeeklyUI();
    }
  });
});

// 초기 실행 (기존 코드 하단에 병합)
updateWeeklyUI();
updateTimerDisplay();
renderTodos();
