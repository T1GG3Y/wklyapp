package com.tiggey.wkly.presentation.components.common

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.tiggey.wkly.presentation.theme.GlassBackground
import com.tiggey.wkly.presentation.theme.GlassBorder

@Composable
fun GlassContainer(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .clip(MaterialTheme.shapes.extraLarge)
            .background(GlassBackground)
            .border(
                width = 1.dp,
                color = GlassBorder,
                shape = MaterialTheme.shapes.extraLarge
            )
            .padding(16.dp),
        content = content
    )
}
