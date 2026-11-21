import raw from "./mbti-hocmai.json";

export type MbtiHocmaiBlock = {
  label: string;
  text: string;
};

export type MbtiHocmaiTrait = {
  letter: string;
  title: string;
  sub: string;
};

export type MbtiHocmaiProfile = {
  code: string;
  title: string;
  intro: string;
  overview: MbtiHocmaiBlock[];
  traits: MbtiHocmaiTrait[];
  famous: string[];
  life: string[];
  work: string[];
  strengths: MbtiHocmaiBlock[];
  weaknesses: MbtiHocmaiBlock[];
  advice: MbtiHocmaiBlock[];
  careerIntro: string[];
  careers: string[];
  source: string;
};

export const MBTI_HOCMAI = raw as unknown as Record<string, MbtiHocmaiProfile>;
