package com.Reboot.Minty.event.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class RouletteDto {
    private Long userId;
    private String result;
    private int point;
    private LocalDate currentDate;
}
