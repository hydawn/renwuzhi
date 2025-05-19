function initProgressingBar(total, eleid) {
  let bar = {
    eleid: eleid,
    total: total,
    current: -1,
    more: function() {
      this.current += 1;
      if (this.current > this.total)
        this.current = this.total;
      const summary = `${this.current}/${this.total}`;
      const bar = `${'='.repeat(this.current)}>${'.'.repeat(this.total - this.current)}`
      setText(this.eleid, `(${summary})[${bar}]`);
    }
  }
  bar.more();
  return bar;
}
