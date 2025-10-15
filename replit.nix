{pkgs}: {
  deps = [
    pkgs.unzip
    pkgs.jq
    pkgs.bc
    pkgs.parallel
    pkgs.postgresql
  ];
}
