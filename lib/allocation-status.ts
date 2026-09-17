export function allocationStatus(income:number,percent:number,actual:number) {
  const target=income*percent/100;
  const state=income<=0?"no-income":actual>target?"exceeded":actual>0&&actual===target?"reached":target>0&&actual>=target*.9?"near":"within";
  return {target,remaining:target-actual,used:target>0?actual/target*100:0,state};
}
