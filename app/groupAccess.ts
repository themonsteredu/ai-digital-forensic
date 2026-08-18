export type GroupAccess = {
  group: number;
  groupId: string;
  phonePin: string;
  clueLabel: string;
  cluePrompt: string;
  clueDate: string;
  recoveryCode: string;
  studentPath: string;
};

export const GROUP_ACCESS: readonly GroupAccess[] = [
  {
    group: 1,
    groupId: "E-01",
    phonePin: "1017",
    clueLabel: "축제 개막일",
    cluePrompt: "제가 절대 잊지 않는 축제 개막일이에요.",
    clueDate: "10월 17일",
    recoveryCode: "DF-2048",
    studentPath: "/?group=1",
  },
  {
    group: 2,
    groupId: "E-02",
    phonePin: "1016",
    clueLabel: "축제 최종 리허설일",
    cluePrompt: "마지막 리허설을 했던 날이라 잊지 않아요.",
    clueDate: "10월 16일",
    recoveryCode: "DF-3157",
    studentPath: "/?group=2",
  },
  {
    group: 3,
    groupId: "E-03",
    phonePin: "1015",
    clueLabel: "축제 부스 설치일",
    cluePrompt: "우리 부스를 처음 설치한 날이에요.",
    clueDate: "10월 15일",
    recoveryCode: "DF-4269",
    studentPath: "/?group=3",
  },
  {
    group: 4,
    groupId: "E-04",
    phonePin: "1014",
    clueLabel: "운영진 안전교육일",
    cluePrompt: "운영진 안전교육을 받은 날로 정했어요.",
    clueDate: "10월 14일",
    recoveryCode: "DF-5382",
    studentPath: "/?group=4",
  },
  {
    group: 5,
    groupId: "E-05",
    phonePin: "1013",
    clueLabel: "축제 물품 반입일",
    cluePrompt: "축제 물품이 학교에 들어온 날이에요.",
    clueDate: "10월 13일",
    recoveryCode: "DF-6495",
    studentPath: "/?group=5",
  },
];

export function getGroupAccess(groupId: string) {
  return GROUP_ACCESS.find((item) => item.groupId === groupId) ?? GROUP_ACCESS[0];
}
